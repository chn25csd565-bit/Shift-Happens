// ============================================================
// KisanVoice Backend — No Database, Full API Pipeline
// STT : Google Cloud Speech-to-Text
// NLU : Dialogflow CX
// TTS : Google Cloud Text-to-Speech
// ============================================================

import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { SpeechClient } from '@google-cloud/speech'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { SessionsClient } from '@google-cloud/dialogflow-cx'
import { fileURLTosPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const upload = multer({ storage: multer.memoryStorage() })

app.use(cors())
app.use(express.json())

// ── Serve frontend ────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.sendFile(join(__dirname, 'index.html'))
})

// ── Google Cloud clients (auth via GOOGLE_APPLICATION_CREDENTIALS) ──
const speechClient = new SpeechClient()
const ttsClient = new TextToSpeechClient()
const dfClient = new SessionsClient({
  apiEndpoint: 'asia-south1-dialogflow.googleapis.com'
})

// ── In-memory session store ───────────────────────────────────
const sessions = new Map()

function getSession(id, language) {
  if (!sessions.has(id)) {
    sessions.set(id, { language: language || 'ml', history: [] })
  }
  return sessions.get(id)
}

// ── Dialogflow CX full session path ──────────────────────────
function dfPath(sessionId) {
  return dfClient.projectLocationAgentSessionPath(
    process.env.DIALOGFLOW_PROJECT_ID,
    process.env.DIALOGFLOW_LOCATION,
    process.env.DIALOGFLOW_AGENT_ID,
    sessionId
  )
}

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }))

// ── POST /session/start ───────────────────────────────────────
app.post('/session/start', (req, res) => {
  const { language = 'ml' } = req.body
  const sessionId = 'kv-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
  getSession(sessionId, language)
  res.json({
    farmer: { id: 'web-user' },
    session: { id: sessionId }
  })
})

// ── POST /session/message ─────────────────────────────────────
app.post('/session/message', upload.single('audio'), async (req, res) => {
  const { session_id, language = 'ml' } = req.body
  const session = getSession(session_id, language)

  const langTag = language === 'ml' ? 'ml-IN' : 'en-IN'
  const ttsVoice = language === 'ml' ? 'ml-IN-Wavenet-A' : 'en-IN-Wavenet-B'

  if (!req.file) {
    return res.status(400).json({ error: 'No audio received.' })
  }

  // ── Step 1: Speech-to-Text ────────────────────────────────
  let transcript = ''
  let sttConfidence = 0

  try {
    const [sttRes] = await speechClient.recognize({
      audio: { content: req.file.buffer.toString('base64') },
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: langTag,
        alternativeLanguageCodes: ['en-IN'],
        enableAutomaticPunctuation: true,
        model: 'latest_long'
      }
    })

    const best = sttRes.results?.[0]?.alternatives?.[0]
    transcript = best?.transcript?.trim() || ''
    sttConfidence = best?.confidence || 0

    if (!transcript) {
      return res.status(422).json({ error: 'Could not understand audio. Please speak clearly and try again.' })
    }
  } catch (err) {
    console.error('[STT]', err.message)
    return res.status(500).json({ error: 'Speech recognition failed: ' + err.message })
  }

  // ── Step 2: Dialogflow CX ─────────────────────────────────
  let replyText = ''
  let diagnosis = null
  let escalated = false
  let escalateReason = ''

  try {
    const [dfResponse] = await dfClient.detectIntent({
      session: dfPath(session_id),
      queryInput: {
        text: { text: transcript },
        languageCode: langTag
      },
      queryParams: {
        timeZone: 'Asia/Kolkata'
      }
    })

    const dfResult = dfResponse.queryResult

    replyText = (dfResult.responseMessages || [])
      .filter(m => m.message === 'text')
      .flatMap(m => m.text?.text || [])
      .join(' ')
      .trim()

    if (!replyText) {
      replyText = language === 'ml'
        ? 'ക്ഷമിക്കണം, എനിക്ക് മനസ്സിലായില്ല. ദയവായി വീണ്ടും പറയൂ.'
        : 'Sorry, I did not understand. Could you please repeat that?'
    }

    const params = dfResult?.parameters?.fields || {}
    const confidence = parseFloat(params.confidence?.numberValue || 0)
    const crop = params.crop?.stringValue || ''
    const problem = params.problem?.stringValue || ''

    if (crop && problem && confidence >= 0.6) {
      diagnosis = {
        crop,
        problem,
        severity: params.severity?.stringValue || 'medium',
        confidence,
        remedy_text: replyText
      }
    } else if (confidence > 0 && confidence < 0.6) {
      escalated = true
      escalateReason = 'Low confidence ' + confidence.toFixed(2) + ' — routing to expert'
    }

  } catch (err) {
    console.error('[Dialogflow CX]', err.message)
    replyText = language === 'ml'
      ? 'സേവനം ലഭ്യമല്ല. ദയവായി വീണ്ടും ശ്രമിക്കൂ.'
      : 'Service temporarily unavailable. Please try again.'
  }

  // ── Step 3: Text-to-Speech ────────────────────────────────
  let replyAudioB64 = null
  let replyDuration = '0'

  try {
    const [ttsRes] = await ttsClient.synthesizeSpeech({
      input: { text: replyText },
      voice: {
        languageCode: langTag,
        name: ttsVoice,
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.9,
        pitch: 0.0,
        effectsProfileId: ['handset-class-device']
      }
    })

    replyAudioB64 = Buffer.from(ttsRes.audioContent).toString('base64')

    const wpm = language === 'ml' ? 120 : 150
    replyDuration = ((replyText.split(/\s+/).length / wpm) * 60).toFixed(1)

  } catch (err) {
    console.error('[TTS]', err.message)
  }

  // ── Step 4: Update in-memory history ─────────────────────
  session.history.push(
    { role: 'farmer', text: transcript, time: Date.now() },
    { role: 'assistant', text: replyText, time: Date.now() }
  )

  // ── Step 5: Send response ─────────────────────────────────
  res.json({
    transcript,
    stt_confidence: sttConfidence,
    reply_text: replyText,
    reply_audio_b64: replyAudioB64,
    reply_duration: replyDuration,
    diagnosis: diagnosis || null,
    escalated,
    reason: escalateReason
  })
})

// ── POST /session/end ─────────────────────────────────────────
app.post('/session/end', (req, res) => {
  sessions.delete(req.body.session_id)
  res.json({ ok: true })
})

// ── GET /session/:id/history ──────────────────────────────────
app.get('/session/:id/history', (req, res) => {
  const s = sessions.get(req.params.id)
  if (!s) return res.status(404).json({ error: 'Session not found' })
  res.json({ messages: s.history })
})

app.listen(process.env.PORT || 3000, () => {
  console.log('KisanVoice running on port ' + (process.env.PORT || 3000))
})