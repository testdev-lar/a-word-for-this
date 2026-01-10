/**
 * Netlify Serverless Function
 * Securely handles OpenRouter API calls
 *
 * This keeps your API key safe by running on the server,
 * not in the user's browser where it could be seen.
 */

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Get the user's emotion text from the request
        const { emotionText } = JSON.parse(event.body);

        if (!emotionText) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing emotion text' })
            };
        }

        // API configuration
        const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
        const API_KEY = process.env.OPENROUTER_API_KEY; // Stored securely in Netlify
        const MODEL = 'mistralai/mixtral-8x7b-instruct';

        const SYSTEM_PROMPT = `You are a linguistic expert and poet. When given a description of an emotion or feeling, find the single best word in any language that captures it perfectly.

Respond in this exact JSON format only, with no additional text:
{
    "word": "the word",
    "pronunciation": "phonetic pronunciation",
    "origin": "language of origin",
    "definition": "a poetic, precise definition of the word"
}

Be poetic yet precise. Prefer obscure, beautiful words from any language. If the word is not English, include the original script if applicable.`;

        // Make the API call to OpenRouter
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': 'https://awordforthis.netlify.app',
                'X-Title': 'A Word for This'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: 'system',
                        content: SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: emotionText
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API error:', errorText);
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        // Return the result to the frontend
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to process request',
                details: error.message
            })
        };
    }
};
