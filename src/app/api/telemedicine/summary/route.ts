import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { notes, patientName, callType } = await req.json();

        if (!notes) {
            return NextResponse.json({ error: 'Notes are required' }, { status: 400 });
        }

        const systemPrompt = `
      You are a medical scribe assisting a doctor. 
      Your task is to generate a concise, professional clinical summary of a telemedicine session based on the doctor's rough notes.
      
      Instructions:
      1. Use medical terminology appropriately.
      2. Keep it concise (max 3-4 sentences).
      3. Focus on: Presenting problem, Key findings/observations, Advice/Treatment given, and Follow-up plan.
      4. Format: Single paragraph.
      5. Tone: Professional and objective.
    `;

        const userPrompt = `
      Patient Name: ${patientName || 'Unknown'}
      Call Type: ${callType}
      Doctor's Notes: ${notes}
      
      Generate a professional clinical summary from these notes.
    `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
        });

        const summary = response.choices[0].message.content;

        return NextResponse.json({ summary });
    } catch (error: any) {
        console.error('AI Summary Error:', error);
        return NextResponse.json({
            error: 'Failed to generate summary',
            details: error.message
        }, { status: 500 });
    }
}
