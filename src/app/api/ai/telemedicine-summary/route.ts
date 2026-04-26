import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { transcript } = await req.json();

        if (!transcript) {
            return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
        }

        const prompt = `You are a medical AI assistant. Analyze the following consultation transcript and generate a structured JSON summary.
        Include three specific string fields in your JSON response:
        1. "case_summary": A high-level overview of the patient's complaints and discussion.
        2. "possible_diagnosis": Potential medical diagnoses based on the symptoms discussed.
        3. "consultation_description": A brief description of the consultation details.
        
        Strictly format the output as JSON.
        
        Transcript:
        "${transcript}"
        `;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Usually it's gpt-4o-mini, check package.json for openai version, should be fine
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const resultText = completion.choices[0]?.message?.content || '{}';
        const parsedResult = JSON.parse(resultText);

        return NextResponse.json({ success: true, data: parsedResult });

    } catch (error: any) {
        console.error('Error generating AI summary:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate summary' }, { status: 500 });
    }
}
