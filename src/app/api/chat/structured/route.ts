import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: Request) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                error: 'OpenAI API key is not configured'
            }, { status: 500 });
        }

        const { messages, systemPrompt } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }

        const coreSystemPrompt = systemPrompt || "You are MedLud AI, a helpful health assistant.";

        const finalSystemPrompt = `
${coreSystemPrompt}

Rules:
1. Provide helpful, empathetic health information.
2. Use Markdown for formatting (bolding, lists, etc.).
3. You are NOT a doctor. Always clarify this.
4. If the user presents symptoms that could be serious or life-threatening (e.g., severe pain, difficulty breathing, persistent high fever, sudden weakness, etc.), set "isSerious" to true and explicitly advise them to consult a professional or see a doctor.
5. You MUST output ONLY valid JSON in the following format:
{
  "reply": "Your markdown formatted response",
  "isSerious": true | false
}
        `;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: finalSystemPrompt },
                ...messages
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content || '{}';
        const parsed = JSON.parse(content);

        return NextResponse.json({
            reply: parsed.reply || "I'm sorry, I couldn't generate a response.",
            isSerious: !!parsed.isSerious
        });

    } catch (error: any) {
        console.error('Structured Chat Error:', error);
        return NextResponse.json({
            error: 'Failed to generate response',
            details: error.message || 'Unknown error'
        }, { status: 500 });
    }
}
