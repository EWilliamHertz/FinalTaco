const https = require('https');
https.get('https://api.scryfall.com/cards/search?q=abaddon', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    console.log(parsed.data[0]);
  });
}).on('error', (err) => console.error(err));
