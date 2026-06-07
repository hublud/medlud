import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const keys = envContent.split('\n').map(line => {
        const parts = line.split('=');
        return parts[0] ? parts[0].trim() : '';
    }).filter(Boolean);
    console.log('Environment variable keys in .env.local:', keys);
} else {
    console.log('.env.local does not exist');
}
