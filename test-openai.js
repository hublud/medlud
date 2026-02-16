const OpenAI = require('openai');

const apiKey = process.env.OPENAI_API_KEY || '';

console.log('Testing OpenAI API Key...');
console.log('Key prefix:', apiKey.substring(0, 20) + '...');

const openai = new OpenAI({ apiKey });

async function test() {
    try {
        console.log('\nTesting with gpt-4o model...');
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: 'Say hello' }],
        });
        console.log('✓ Success!');
        console.log('Response:', completion.choices[0].message.content);
    } catch (error) {
        console.error('\n✗ Error occurred:');
        console.error('Type:', error.constructor.name);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Code:', error.code);

        if (error.status === 401) {
            console.error('\n** API KEY IS INVALID OR EXPIRED **');
        } else if (error.status === 403) {
            console.error('\n** NO ACCESS TO gpt-4o MODEL **');
            console.error('Try using gpt-3.5-turbo instead');
        } else if (error.status === 429) {
            console.error('\n** RATE LIMIT OR QUOTA EXCEEDED **');
        }
    }
}

test();
