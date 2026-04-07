const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const dialogflowWebhook = require('./routes/dialogflowWebhook');
const smsWebhook = require('./routes/smsWebhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev')); // Logger
app.use(bodyParser.json());

// Main Routes
app.use('/webhook/dialogflow', dialogflowWebhook);
app.use('/webhook/sms', smsWebhook);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Farmer AI Helpline Backend is running.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n===================================================`);
  console.log(`🌾 Farmer AI Helpline Backend running on port ${PORT}`);
  console.log(`   Waiting for Dialogflow CX Telephony Webhooks.`);
  console.log(`===================================================\n`);
});
