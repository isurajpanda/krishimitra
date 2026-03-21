const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = 'sk_bkeaeub3_ez14d5CCWw4lEgP03Gsfgbgw';
const OUTPUT_DIR = path.join(__dirname, '..', 'web', 'public', 'audio');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const greetings = [
    {
        lang: 'en-IN',
        text: 'Hello! I am KrishiMitra. Your smart farming assistant. How can I help you today?',
        filename: 'greeting_en.mp3'
    },
    {
        lang: 'hi-IN',
        text: 'नमस्ते! मैं कृषिमित्र हूँ। आपका स्मार्ट खेती सहायक। आज मैं आपकी कैसे मदद कर सकता हूँ?',
        filename: 'greeting_hi.mp3'
    },
    {
        lang: 'od-IN',
        text: 'ନମସ୍କାର! ମୁଁ କୃଷିମିତ୍ର। ଆପଣଙ୍କ ସ୍ମାର୍ଟ ଚାଷ ସହାୟକ। ଆଜି ମୁଁ କିପରି ଆପଣଙ୍କୁ ସହାଯ୍ୟ କରିପାରିବି?',
        filename: 'greeting_or.mp3'
    }
];

async function generateGreeting(item) {
    console.log(`Generating ${item.filename}...`);
    
    // REST API for Sarvam uses "inputs" (array), "target_language_code", and "model": "bulbul:v3"
    const data = JSON.stringify({
        inputs: [item.text],
        model: 'bulbul:v3',
        target_language_code: item.lang,
        speaker: 'shubh', 
        pace: 1.1,
        speech_sample_rate: 24000,
        enable_preprocessing: true
    });

    const options = {
        hostname: 'api.sarvam.ai',
        path: '/text-to-speech',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': API_KEY
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                let errorData = '';
                res.on('data', d => errorData += d);
                res.on('end', () => reject(new Error(`Failed ${res.statusCode}: ${errorData}`)));
                return;
            }

            let chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const result = JSON.parse(Buffer.concat(chunks).toString());
                if (result.audios && result.audios[0]) {
                    const audioBuffer = Buffer.from(result.audios[0], 'base64');
                    fs.writeFileSync(path.join(OUTPUT_DIR, item.filename), audioBuffer);
                    console.log(`Saved ${item.filename}`);
                    resolve();
                } else {
                    reject(new Error('No audio found in response'));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

(async () => {
    try {
        for (const g of greetings) {
            await generateGreeting(g);
        }
        console.log('All greetings generated successfully!');
    } catch (err) {
        console.error('Error generating greetings:', err);
    }
})();
