-- Add fixed rate for template designs
ALTER TABLE public.designs 
ADD COLUMN IF NOT EXISTS template_rate DECIMAL(10, 2) DEFAULT 299.00;

-- Update existing prebuilt designs with default rate
UPDATE public.designs 
SET template_rate = 299.00 
WHERE is_prebuilt = true AND template_rate IS NULL;





