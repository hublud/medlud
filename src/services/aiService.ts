import { supabase } from '@/lib/supabase';

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
    async sendMessage(messages: ChatMessage[], systemPrompt?: string, userId?: string): Promise<string> {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, systemPrompt, userId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('API Error:', errorData);
            throw new Error(`Failed to send message: ${errorData.error || errorData.details || 'Unknown error'}`);
        }
        const data = await response.json();
        return data.reply;
    },

    async getChatHistory(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('ai_chat_messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }

        return data || [];
    },

    async sendMessageStructured(messages: ChatMessage[], userId: string, systemPrompt?: string): Promise<{ reply: string, isSerious: boolean }> {
        const response = await fetch('/api/chat/structured', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, userId, systemPrompt }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('API Error:', errorData);
            throw new Error(errorData.details || errorData.error || 'Failed to send message');
        }

        const data = await response.json();
        return data;
    },

    async analyzeConsultation(consultationText: string): Promise<MedicalAnalysis> {
        const response = await fetch('/api/analyze-medical', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consultationText }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to analyze consultation' }));
            throw new Error(errorData.details || errorData.error || 'Failed to analyze consultation');
        }

        return await response.json();
    }
};
