const express = require('express');
const router = express.Router();
const db = require('../db');
const { analyzeAgronomySymptoms } = require('../services/diagnosis');

// Simple unified chat endpoint for the web frontend
router.post('/chat', (req, res) => {
  const { farmerPhone, crop, symptom } = req.body;

  if (!symptom) {
    return res.status(400).json({ error: "Symptom description is required" });
  }

  const phone = farmerPhone || "anonymous";

  // Register farmer if phone provided
  if (phone !== "anonymous") {
    db.run(`INSERT OR IGNORE INTO farmers (phone_number, preferred_language) VALUES (?, ?)`, [phone, 'en']);
  }

  // Analyze symptoms
  const analysisContent = `${crop || 'unknown'} - ${symptom}`;
  const result = analyzeAgronomySymptoms(crop, symptom, {});

  // Log interaction
  db.run(`INSERT INTO interactions (farmer_phone, symptoms_described, diagnosis, recommendation, escalated)
          VALUES (?, ?, ?, ?, ?)`,
    [
      phone, 
      analysisContent, 
      result.diagnosis || null, 
      result.recommendation || null, 
      result.action === 'ESCALATE' ? 1 : 0
    ], 
    (err) => {
      if (err) console.error("Error logging interaction:", err);
    }
  );

  // Return formatted response for the website
  return res.json({
    reply: result.message,
    action: result.action,
    diagnosis: result.diagnosis || null
  });
});

module.exports = router;
