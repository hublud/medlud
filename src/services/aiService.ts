
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface MedicalAnalysis {
    chiefComplaint: string;
    detectedSymptoms: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    suggestedActions: string[];
}

export const aiService = {
    async sendMessage(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, systemPrompt }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('API Error:', errorData);
            throw new Error(`Failed to send message: ${errorData.error || errorData.details || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.reply;
    },

    async analyzeConsultation(consultationText: string): Promise<MedicalAnalysis> {
        const response = await fetch('/api/analyze-medical', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consultationText }),
        });

        if (!response.ok) {
            throw new Error('Failed to analyze consultation');
        }

        return await response.json();
    }
};
