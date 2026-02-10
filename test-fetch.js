const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    const url = 'https://supjav.com/363438.html';
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=10.9',
                'Referer': 'https://supjav.com/',
            },
            timeout: 10000,
        });
        const $ = cheerio.load(response.data);
        const archiveTitle = $('.archive-title').first().text().trim();
        console.log('Archive Title:', archiveTitle);
        console.log('Meta Title:', $('title').text().trim());
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.log('Status:', err.response.status);
        }
    }
}

test();
