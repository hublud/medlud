-- Create appointment history table for tracking changes
CREATE TABLE IF NOT EXISTS appointment_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
    changed_by uuid REFERENCES profiles(id),
    old_status text,
    new_status text,
    old_staff_id uuid REFERENCES profiles(id),
    new_staff_id uuid REFERENCES profiles(id),
    change_note text,
    created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment_id ON appointment_history(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_created_at ON appointment_history(created_at DESC);

-- Add staff_id column to appointments if it doesn't exist
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES profiles(id);

-- Create index for staff assignments
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);
