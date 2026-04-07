KisanVoice

Problem Statement:
Agriculture faces persistent challenges due to unpredictable weather conditions, crop diseases, inefficient resource utilization, and limited access to timely insights. These factors significantly impact productivity and sustainability. 
Farmers in rural India, particularly Malayalam-speaking communities in Kerala, lack accessible and timely agricultural support. Most existing solutions require literacy, internet savviness, or English proficiency creating a barrier for farmers who need quick diagnosis of crop diseases and pest problems. When a crop is failing, every hour matters.

Project Description:
KisanVoice is a voice-first AI helpline that lets farmers speak in Malayalam (or English) about their crop problems and receive instant spoken diagnoses and remedies; no typing, no reading required.
The farmer presses a button, describes their problem out loud, and within seconds hears a response in their own language with actionable advice. The system transcribes their speech, understands their intent, generates a diagnosis, and speaks the answer back — all in one seamless pipeline.
What makes it useful:
1.⁠ ⁠Works entirely by voice — no literacy required
2.⁠ ⁠Supports Malayalam and English
3.⁠ ⁠Provides crop disease diagnosis with severity and remedy
4.⁠ ⁠Escalates complex cases for expert review
5.⁠ ⁠Runs in any browser, no app install needed

Google AI Usage:
Tools / Models Used
Tool                                           Purpose
Google Cloud Speech-to-Text                    Converts farmer's voice to text in Malayalam/English
Dialogflow CX                                  Natural language understanding, intent detection, diagnosis flow
Google Cloud Text-to-Speech                    Converts AI response back to spoken Malayalam/English audio

How Google AI Was Used:
Speech-to-Text — The farmer's audio (recorded in browser) is sent to Google Cloud STT which transcribes it in ml-IN (Malayalam) or en-IN (English) with automatic punctuation and confidence scoring.
Dialogflow CX — The transcript is sent to a Dialogflow CX agent trained on crop disease intents. The agent extracts entities like crop name, problem type, and severity, and returns a structured diagnosis with session parameters (crop, problem, severity, confidence).
Text-to-Speech — The diagnosis text is converted to natural-sounding speech using Wavenet voices (ml-IN-Wavenet-A for Malayalam, en-IN-Wavenet-B for English) and played back to the farmer as an MP3.

Proof of Google AI Usage:
<img width="522" height="219" alt="1" src="https://github.com/user-attachments/assets/be3b69f3-0d7c-40ef-9700-d0a34482a918" />
<img width="551" height="203" alt="2" src="https://github.com/user-attachments/assets/90e12851-6ea3-4ccc-aa09-21f039f46f7a" />
<img width="649" height="243" alt="3" src="https://github.com/user-attachments/assets/3abedb76-5ab2-44cb-a70e-d4c02131b6f0" />

Screenshot:


Demo Video:


Installations Steps:
# Clone the repository
git clone https://github.com/chn25csd565-bit/Shift-Happens

# Go to project folder
cd Shift-Happens

# Install dependencies
npm install

# Add your credentials
# Create a .env file with:
# GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
# DIALOGFLOW_PROJECT_ID=your-project-id
# DIALOGFLOW_LOCATION=asia-south1
# DIALOGFLOW_AGENT_ID=your-agent-id
# PORT=3000

# Run the project
npm start

Tech Stack:
Frontend: HTML, CSS, JavaScript (vanilla)
Backend: Node.js, Express
AI: Google Cloud Speech-to-Text, Dialogflow CX, Google Cloud Text-to-Speech
