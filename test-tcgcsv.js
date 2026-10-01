const https = require('https');
https.get('https://tcgcsv.com/tcgplayer/3/23237/prices', { headers: { 'User-Agent': 'hatake-social/1.0' } }, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    const subtypes = new Set(parsed.results.map(p => p.subTypeName));
    console.log("Subtypes:", Array.from(subtypes));
  });
});
