-- Create telemedicine_calls table
CREATE TABLE IF NOT EXISTS public.telemedicine_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES auth.users(id) NOT NULL,
    provider_id UUID REFERENCES auth.users(id),
    channel_name TEXT NOT NULL,
    token TEXT,
    call_type TEXT NOT NULL CHECK (call_type IN ('VIDEO', 'VOICE')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    duration INTEGER, -- in seconds
    ai_summary TEXT,
    provider_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.telemedicine_calls ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Patients can see their own calls
CREATE POLICY "Users can view their own calls" 
ON public.telemedicine_calls FOR SELECT 
USING (auth.uid() = patient_id);

-- 2. Staff/Admins can see all pending or assigned calls
CREATE POLICY "Staff can view relevant calls" 
ON public.telemedicine_calls FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('doctor', 'nurse', 'staff', 'admin')
    )
);

-- 3. Patients can insert new calls
CREATE POLICY "Patients can start calls" 
ON public.telemedicine_calls FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

-- 4. Staff can update calls (to accept or complete them)
CREATE POLICY "Staff can update calls" 
ON public.telemedicine_calls FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('doctor', 'nurse', 'staff', 'admin')
    )
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE telemedicine_calls;

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_telemedicine_calls_updated_at
    BEFORE UPDATE ON public.telemedicine_calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
