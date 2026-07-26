const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { askAssistant } = require('../services/aiService');

const router = express.Router();

/**
 * @route   POST /api/ai/ask
 * @desc    Ask the AI assistant about selected text
 * @access  Private
 */
router.post('/ask', requireAuth, async (req, res, next) => {
  try {
    const { prompt, selectedText, openrouterApiKey } = req.body;

    if (!prompt || !selectedText) {
      return res.status(400).json({ error: 'prompt and selectedText are required' });
    }

    const { result, error } = await askAssistant(prompt, selectedText, openrouterApiKey);

    if (error) {
      return res.status(500).json({ error });
    }

    res.json({ result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
