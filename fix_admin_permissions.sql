-- SCRIPT DE REPARACION DE PERMISOS ADMIN
-- Copia y pega esto en Supabase SQL Editor y dale Run

-- 1. Habilitar seguridad (por si acaso)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 2. Dar permiso TOTAL al administrador (Authenticated)
-- Esto soluciona que el dashboard salga vacio
CREATE POLICY "Admin All Access"
ON tickets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Asegurar lectura pública (Anon)
CREATE POLICY "Public Read"
ON tickets
FOR SELECT
TO anon
USING (true);

-- 4. Asegurar compra pública (Anon)
CREATE POLICY "Public Insert"
ON tickets
FOR INSERT
TO anon
WITH CHECK (true);
