export interface Prescription {
    id: string;
    appointment_id: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
    created_at?: string;
}

export interface ChatMessage {
    id: string;
    appointment_id: string;
    sender_id?: string;
    role: 'USER' | 'AI' | 'DOCTOR';
    content: string;
    image_url?: string;
    created_at: string; // ISO string from DB
}

export interface Appointment {
    id: string;
    user_id: string | null;
    doctor_id?: string | null;
    staff_id?: string | null;
    title: string | null;
    description: string | null;
    symptoms: string | null;
    duration?: string | null;
    severity?: string | null;
    medication_details?: string | null;
    date: string | null;
    status: string | null;
    priority?: string | null;
    category?: string | null;
    ai_summary?: any;
    doctor_response?: string | null;
    created_at: string | null;

    // Joined fields
    user?: {
        full_name: string | null;
        email: string | null;
    } | null;
    staff?: {
        full_name: string | null;
        email: string | null;
    } | null;
    patient?: {
        full_name?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
        med_id?: string | null;
    } | null;
    doctor?: {
        full_name?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
    } | null;
    messages?: ChatMessage[];
    prescriptions?: Prescription[];
}
