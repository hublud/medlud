const fs = require('fs');
const path = require('path');

const sqlDir = path.resolve(__dirname, 'sql');
const files = fs.readdirSync(sqlDir);

console.log('Searching in SQL files...');
files.forEach(file => {
    if (!file.endsWith('.sql')) return;
    const content = fs.readFileSync(path.join(sqlDir, file), 'utf-8');
    
    // Search for trigger or profile definitions
    if (content.toLowerCase().includes('trigger') || content.toLowerCase().includes('handle_new_user')) {
        console.log(`\n--- Match in ${file} ---`);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            if (line.toLowerCase().includes('trigger') || line.toLowerCase().includes('handle_new_user') || line.toLowerCase().includes('profile')) {
                console.log(`${index + 1}: ${line.trim()}`);
            }
        });
    }
});
