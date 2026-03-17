-- ==============================================================
-- Community foods catalog (multi-tenant + RLS)
-- Execute this script in Supabase SQL Editor
-- ==============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.alimentos_comunidad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    marca TEXT,
    porcion TEXT NOT NULL DEFAULT '100 g',
    calorias NUMERIC(8, 2) NOT NULL,
    proteinas NUMERIC(8, 2) NOT NULL DEFAULT 0,
    carbos NUMERIC(8, 2) NOT NULL DEFAULT 0,
    grasas NUMERIC(8, 2) NOT NULL DEFAULT 0,
    fibra NUMERIC(8, 2) NOT NULL DEFAULT 0,
    fuente TEXT NOT NULL DEFAULT 'comunidad',
    verificado BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT alimentos_comunidad_nombre_not_blank CHECK (btrim(nombre) <> ''),
    CONSTRAINT alimentos_comunidad_marca_not_blank CHECK (marca IS NULL OR btrim(marca) <> ''),
    CONSTRAINT alimentos_comunidad_porcion_not_blank CHECK (btrim(porcion) <> ''),
    CONSTRAINT alimentos_comunidad_calorias_non_negative CHECK (calorias >= 0),
    CONSTRAINT alimentos_comunidad_proteinas_non_negative CHECK (proteinas >= 0),
    CONSTRAINT alimentos_comunidad_carbos_non_negative CHECK (carbos >= 0),
    CONSTRAINT alimentos_comunidad_grasas_non_negative CHECK (grasas >= 0),
    CONSTRAINT alimentos_comunidad_fibra_non_negative CHECK (fibra >= 0),
    CONSTRAINT alimentos_comunidad_fuente_valid CHECK (fuente IN ('comunidad', 'sistema'))
);

CREATE UNIQUE INDEX IF NOT EXISTS alimentos_comunidad_unique_name_brand_idx
    ON public.alimentos_comunidad (
        tenant_id,
        lower(nombre),
        COALESCE(lower(marca), '')
    )
    WHERE activo = TRUE;

CREATE INDEX IF NOT EXISTS alimentos_comunidad_tenant_created_at_idx
    ON public.alimentos_comunidad (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS alimentos_comunidad_tenant_fuente_idx
    ON public.alimentos_comunidad (tenant_id, fuente);

CREATE OR REPLACE FUNCTION public.alimentos_comunidad_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS alimentos_comunidad_touch_updated_at ON public.alimentos_comunidad;

CREATE TRIGGER alimentos_comunidad_touch_updated_at
BEFORE UPDATE ON public.alimentos_comunidad
FOR EACH ROW
EXECUTE FUNCTION public.alimentos_comunidad_touch_updated_at();

ALTER TABLE public.alimentos_comunidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alimentos_comunidad FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alimentos_comunidad_select_policy ON public.alimentos_comunidad;
CREATE POLICY alimentos_comunidad_select_policy
ON public.alimentos_comunidad
FOR SELECT
TO authenticated
USING (
    tenant_id = public.get_current_user_tenant_id()
    AND activo = TRUE
);

DROP POLICY IF EXISTS alimentos_comunidad_insert_policy ON public.alimentos_comunidad;
CREATE POLICY alimentos_comunidad_insert_policy
ON public.alimentos_comunidad
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = public.get_current_user_tenant_id()
    AND creado_por = auth.uid()
    AND fuente = 'comunidad'
);

DROP POLICY IF EXISTS alimentos_comunidad_update_policy ON public.alimentos_comunidad;
CREATE POLICY alimentos_comunidad_update_policy
ON public.alimentos_comunidad
FOR UPDATE
TO authenticated
USING (
    tenant_id = public.get_current_user_tenant_id()
    AND (
        public.current_user_is_trainer()
        OR creado_por = auth.uid()
    )
)
WITH CHECK (
    tenant_id = public.get_current_user_tenant_id()
    AND (
        public.current_user_is_trainer()
        OR creado_por = auth.uid()
    )
);

DROP POLICY IF EXISTS alimentos_comunidad_delete_policy ON public.alimentos_comunidad;
CREATE POLICY alimentos_comunidad_delete_policy
ON public.alimentos_comunidad
FOR DELETE
TO authenticated
USING (
    tenant_id = public.get_current_user_tenant_id()
    AND (
        public.current_user_is_trainer()
        OR creado_por = auth.uid()
    )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alimentos_comunidad TO authenticated;
GRANT ALL ON public.alimentos_comunidad TO service_role;

-- Optional read model for UI (label community-origin rows).
CREATE OR REPLACE VIEW public.alimentos_catalogo_ui AS
SELECT
    id,
    tenant_id,
    creado_por,
    nombre,
    marca,
    porcion,
    calorias,
    proteinas,
    carbos,
    grasas,
    fibra,
    fuente,
    CASE
        WHEN fuente = 'comunidad' THEN 'Subido por la comunidad'
        ELSE 'Base del sistema'
    END AS origen_label,
    verificado,
    created_at,
    updated_at
FROM public.alimentos_comunidad
WHERE activo = TRUE;

GRANT SELECT ON public.alimentos_catalogo_ui TO authenticated;
GRANT SELECT ON public.alimentos_catalogo_ui TO service_role;

COMMIT;
