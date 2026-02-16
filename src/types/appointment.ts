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
    user_id: string; // Changed from patient_id to match BookingForm
    doctor_id?: string;
    title: string;
    description: string; // Can be a computed view or just separate field
    symptoms: string;
    duration?: string; // Existing field from BookingForm
    severity?: 'mild' | 'moderate' | 'severe'; // Existing field from BookingForm
    medication_details?: string; // Existing field
    date: string; // ISO date string
    status: 'PENDING' | 'RESPONDED' | 'COMPLETED' | 'CANCELLED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'; // New field we want to add
    category?: 'general' | 'mental-health' | 'maternal'; // New field for categorization
    ai_summary?: {
        chiefComplaint: string;
        keySymptoms: string[];
        suggestedActions: string[];
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    doctor_response?: string;
    created_at: string;

    // Joined fields (optional, depend on query)
    patient?: { // mapped from profiles via user_id
        first_name: string;
        last_name: string;
        email?: string;
        date_of_birth?: string;
        blood_group?: string;
        gender?: string;
    };
    doctor?: {
        first_name?: string;
        last_name?: string;
        full_name?: string;
        role?: string;
    };
    messages?: ChatMessage[];
    prescriptions?: Prescription[];
}
