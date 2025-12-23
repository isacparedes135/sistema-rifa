-- =================================================================
-- SCRIPT DE RESET TOTAL DE PERMISOS (V2)
-- Usa este si el anterior no funcionó.
-- =================================================================

-- 1. Borrar cualquier política basura que pudiera existir
DROP POLICY IF EXISTS "Admin Full Access" ON tickets;
DROP POLICY IF EXISTS "Admin All Access" ON tickets;
DROP POLICY IF EXISTS "Public Read Access" ON tickets;
DROP POLICY IF EXISTS "Public Insert Access" ON tickets;
DROP POLICY IF EXISTS "Public Read" ON tickets;
DROP POLICY IF EXISTS "Public Insert" ON tickets;
DROP POLICY IF EXISTS "Public tickets are viewable" ON tickets;
DROP POLICY IF EXISTS "Public can insert tickets" ON tickets;
DROP POLICY IF EXISTS "Public can update tickets" ON tickets;

-- 2. Asegurar RLS activado
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas Limpias (Nombres Nuevos para evitar conflictos)

-- 3.1 ADMIN (Todo poderoso)
CREATE POLICY "policy_admin_all_v2"
ON tickets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3.2 PUBLICO (Solo ver y comprar)
CREATE POLICY "policy_public_select_v2"
ON tickets
FOR SELECT
TO anon
USING (true);

CREATE POLICY "policy_public_insert_v2"
ON tickets
FOR INSERT
TO anon
WITH CHECK (true);
