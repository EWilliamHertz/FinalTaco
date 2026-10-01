const fs = require('fs');
let content = fs.readFileSync('src/app/collection/page.tsx', 'utf8');

content = content.replace(/\{vault\.length < 50 \?/g, '{cards.length < 50 ?');
content = content.replace(/vault\.length\/50/g, 'cards.length/50');
content = content.replace(/\{vault\.length\}\/50/g, '{cards.length}/50');
content = content.replace(/\(vault\.length \/ 50\)/g, '(cards.length / 50)');
content = content.replace(/c\.cardId/g, 'c.Card.id');

fs.writeFileSync('src/app/collection/page.tsx', content);
