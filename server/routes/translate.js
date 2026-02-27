import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// Initialize the Google GenAI client — reads GEMINI_API_KEY from env automatically
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// POST /api/translate — translate text using Gemini 3 Flash
router.post('/', async (req, res) => {
    try {
        const { text, sourceLang, targetLang, field } = req.body;

        if (!text || !sourceLang || !targetLang) {
            return res.status(400).json({ error: 'text, sourceLang, and targetLang are required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
        }

        const langNames = { en: 'English', zh: 'Chinese (Simplified)' };
        const srcName = langNames[sourceLang] || sourceLang;
        const tgtName = langNames[targetLang] || targetLang;

        const fieldHint = field === 'name'
            ? 'This is a product name for an e-commerce platform. Keep it concise, commercial, and appealing.'
            : 'This is a product description for an e-commerce platform. Keep the marketing tone and formatting.';

        const prompt = `Translate the following ${srcName} text to ${tgtName}. ${fieldHint}

IMPORTANT RULES:
- Return ONLY the translated text, nothing else
- Do NOT add quotes, explanations, or prefixes
- Maintain the original formatting (line breaks, bullet points, etc.)
- Keep brand names, model numbers, and technical terms as-is

Text to translate:
${text}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        const translated = response.text?.trim();

        if (!translated) {
            return res.status(502).json({ error: 'No translation returned' });
        }

        res.json({ translated, sourceLang, targetLang });
    } catch (err) {
        console.error('Translation error:', err.message);

        // Handle quota/rate limit errors
        if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
            return res.status(429).json({ error: 'Translation quota exceeded. Please try again later.' });
        }

        res.status(500).json({ error: err.message });
    }
});

export default router;
