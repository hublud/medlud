-- Migration to add missing columns for telemedicine sessions
ALTER TABLE public.telemedicine_calls ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE public.telemedicine_calls ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE public.telemedicine_calls ADD COLUMN IF NOT EXISTS provider_notes TEXT;

-- Verify columns (optional but good for logs)
COMMENT ON COLUMN public.telemedicine_calls.duration IS 'Call duration in seconds';
COMMENT ON COLUMN public.telemedicine_calls.ai_summary IS 'AI clinical summary generated from notes';
COMMENT ON COLUMN public.telemedicine_calls.provider_notes IS 'Clinical notes provided by the medical professional';
