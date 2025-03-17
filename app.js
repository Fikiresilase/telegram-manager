const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

// Hardcoded configuration - Replace with your actual values
const config = {
    GEMINI_API_KEY: 'AIzaSyDmwDY6169AP-ks-TYL-QeObqJs9jbEQQA',
    TELEGRAM_BOT_TOKEN: '7356101227:AAEcGGAoHTA-u_L8VlbEp3sXB5tHr53iNL4',
    TELEGRAM_CHANNEL_ID: '@software_programming1' // or chat ID
};

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Scrape tech tidbits from TechCrunch
async function scrapeTechTidbits() {
    try {
        const url = 'https://techcrunch.com/category/software/';
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const tidbits = [];

        $('article .post-block__title a').each((i, element) => {
            if (i < 3) {
                const title = $(element).text().trim();
                tidbits.push(title);
            }
        });

        $('article .post-block__content').each((i, element) => {
            if (i < 3 && tidbits[i]) {
                const summary = $(element).text().trim();
                tidbits[i] += ` - ${summary}`;
            }
        });

        return tidbits.length ? tidbits : ["Nothing hot or spicy from TechCrunch today."];
    } catch (error) {
        console.error('Tech scrape failed:', error.message);
        return ["Tech’s keeping it low-key today."];
    }
}

// Scrape chess content from Chess.com
async function scrapeChessTidbits() {
    try {
        const url = 'https://www.chess.com/news';
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const tidbits = [];

        $('.post-preview-title a').each((i, element) => {
            if (i < 2) {
                const title = $(element).text().trim();
                tidbits.push(`News: ${title}`);
            }
        });

        $('.post-preview-content').each((i, element) => {
            if (i < 2 && tidbits[i]) {
                const snippet = $(element).text().trim().substring(0, 100);
                tidbits[i] += ` - ${snippet}`;
            }
        });

        return tidbits.length ? tidbits : ["Chess news is quiet today."];
    } catch (error) {
        console.error('Chess scrape failed:', error.message);
        return ["Chess world’s taking a nap."];
    }
}

// Format the text with HTML for Telegram
function formatCodeTicklerPost(text) {
    const parts = text.split('. ');
    let formatted = '<b>Hello CodeTicklers </b>\n\n'; // Fixed "CodeTickler’s" typo
    
    formatted += `${parts[0]}.\n\n`;
    formatted += parts.slice(1, -2).join('.\n') + '.\n\n';
    const lastBits = parts.slice(-2).join('. ');
    formatted += `<b>${lastBits}</b>`;
    
    return formatted;
}

// Check if scraped data is hot or controversial
function isHotOrControversial(tidbits) {
    const hotKeywords = ['break', 'crash', 'fail', 'launch', 'new', 'reveal', 'update', 'major', 'huge', 'big'];
    const controversyKeywords = ['controversy', 'dispute', 'fight', 'ban', 'lawsuit', 'ethics', 'scandal', 'rage', 'anger'];
    return tidbits.some(t => {
        const lowerT = t.toLowerCase();
        return hotKeywords.some(k => lowerT.includes(k)) || controversyKeywords.some(k => lowerT.includes(k));
    });
}

// CodeTickler’s content generation
async function generateContent() {
    try {
        const isChessPost = Math.random() < 0.3; // 30% chance for chess
        const tidbits = isChessPost ? await scrapeChessTidbits() : await scrapeTechTidbits();
        const hasHotNews = isHotOrControversial(tidbits);
        const rand = Math.random();

        let prompt;
        if (hasHotNews && rand < 0.1) { // 10% chance for hot news
            prompt = isChessPost
                ? `
                CodeTickler here with chess news: ${tidbits.join(' | ')} 
                Write a detailed update (at least 80 words) on this hot or controversial chess topic—cover the latest match, event, or player drama with insight. Keep it clear and engaging, like I’m briefing my dev team. Use a joke or slang only if it fits naturally. Focus on facts and analysis, no over-the-top comedy.
                `
                : `
                CodeTickler here with tech news: ${tidbits.join(' | ')} 
                Write a detailed update (at least 80 words) on this hot or controversial tech topic—explain the rollout, fail, or bigwig’s take (name them if there). Keep it clear and engaging, like I’m briefing my dev team. Use a joke or slang only if it fits naturally. Stick to facts and analysis, no wild comedy.
                `;
        } else if (rand < 0.37) { // 27% chance for tips (0.1 to 0.37)
            prompt = isChessPost
                ? `
                CodeTickler here with a chess tip. 
                Write a detailed guide (at least 80 words) on a useful chess strategy or tactic—explain it clearly with steps or examples, like I’m coaching my dev team. Keep it practical and insightful. Add a light joke or slang only if it suits the vibe. No fluff, just solid advice.
                `
                : `
                CodeTickler here with a tech tip. 
                Write a detailed guide (at least 80 words) on a practical JavaScript or framework technique—explain it clearly with steps or examples, like I’m coaching my dev team. Keep it useful and insightful. Add a light joke or slang only if it suits the vibe. No fluff, just solid advice.
                `;
        } else { // 63% chance for facts (0.37 to 1.0)
            prompt = isChessPost
                ? `
                CodeTickler here with chess trivia. 
                Write a detailed piece (at least 80 words) on a rare, fascinating chess fact—could be history, a quirky rule, or an odd match detail. Explain it clearly, like I’m sharing with my dev team. Keep it intriguing and factual. Drop a joke or slang only if it flows naturally. No overblown humor.
                `
                : `
                CodeTickler here with tech trivia. 
                Write a detailed piece (at least 80 words) on a rare, fascinating tech fact—could be old hardware, obscure code history, or a weird dev story. Explain it clearly, like I’m sharing with my dev team. Keep it intriguing and factual. Drop a joke or slang only if it flows naturally. No overblown humor.
                `;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();
        
        text = text.replace(/[\*\_]+/g, '');
        const wordCount = text.split(/\s+/).length;
        if (wordCount < 80) {
            text += isChessPost 
                ? ' Bonus: Always watch your back rank—losing to a sneaky mate stings worse than a bug in prod.'
                : ' Bonus: Cache your API calls—speed’s king when your app’s on the line.';
        }

        return formatCodeTicklerPost(text);
    } catch (error) {
        console.error('Content generation failed:', error);
        const fallback = "CodeTickler here with a tech tip. Use .try() to catch errors—it’s simple but saves headaches. Wrap risky code and log the fails, like guarding a weak pawn. Devs skip this, then cry when it crashes. Been there. Works in any framework, trust me. Keeps your app smooth and your sanity intact.";
        return formatCodeTicklerPost(fallback);
    }
}

// Telegram posting function
async function postToTelegram(content) {
    try {
        const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const response = await axios.post(url, {
            chat_id: config.TELEGRAM_CHANNEL_ID,
            text: content,
            parse_mode: 'HTML'
        });
        
        console.log('CodeTickler posted:', response.data);
        return response.data;
    } catch (error) {
        console.error('Telegram post failed:', error);
        throw error;
    }
}

// Endpoints
app.get('/', async (req, res) => {
    res.send('CodeTickler’s online! Hit /generate-and-post for the good stuff.');
});

app.get('/generate-and-post', async (req, res) => {
    try {
        const content = await generateContent();
        await postToTelegram(content);
        res.json({ success: true, content, message: "CodeTickler’s dropping knowledge!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, message: "CodeTickler’s stumped!" });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'CodeTickler’s running!', timestamp: new Date() });
});

// Export for Vercel serverless
module.exports = app;