-- Add unique constraint for quinquenios upsert
ALTER TABLE public.quinquenios 
ADD CONSTRAINT quinquenios_servidor_numero_unique 
UNIQUE (servidor_id, numero);