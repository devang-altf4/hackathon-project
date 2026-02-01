const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authenticate } = require('../middleware/authMiddleware');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/suggest-price', authenticate, async (req, res) => {
  try {
    const { material, category, quantity, unit } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert in waste management and recycling prices in India.
      Suggest a fair market price range and a recommended single price in Indian Rupees (INR) for selling:
      
      Item: ${material}
      Category: ${category}
      Quantity: ${quantity} ${unit}
      
      Provide the output in strict JSON format like this:
      {
        "minPrice": number,
        "maxPrice": number,
        "recommendedPrice": number,
        "reasoning": "short explanation"
      }
      Do not include any markdown formatting, just the JSON string.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean potential markdown code blocks
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const priceData = JSON.parse(cleanJson);
    res.json(priceData);

  } catch (error) {
    console.error('Error fetching AI price suggestion:', error);
    res.status(500).json({ message: 'Failed to get price suggestion', error: error.message });
  }
});

module.exports = router;
