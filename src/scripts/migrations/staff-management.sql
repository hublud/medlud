-- Create staff availability table
CREATE TABLE IF NOT EXISTS staff_availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week int CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    start_time time NOT NULL,
    end_time time NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create staff ratings table
CREATE TABLE IF NOT EXISTS staff_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id uuid REFERENCES profiles(id),
    rating int CHECK (rating >= 1 AND rating <= 5),
    feedback text,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_id ON staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_day ON staff_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_staff_ratings_staff_id ON staff_ratings(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_ratings_created_at ON staff_ratings(created_at DESC);

-- Add unique constraint to prevent duplicate availability slots
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_availability_unique 
ON staff_availability(staff_id, day_of_week, start_time, end_time);
