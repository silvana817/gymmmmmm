-- =============================================================================
-- DESTRUCTIVE RESET + CLEAN BOOTSTRAP FOR SUPABASE
-- WARNING: this removes all application data from public tables.
-- It does not remove auth.users records.
-- =============================================================================

BEGIN;

DROP TABLE IF EXISTS public.workout_logs CASCADE;
DROP TABLE IF EXISTS public.nutricion_registros CASCADE;
DROP TABLE IF EXISTS public.nutricion_perfiles CASCADE;
DROP TABLE IF EXISTS public.planes_nutricionales CASCADE;
DROP TABLE IF EXISTS public.pagos CASCADE;
DROP TABLE IF EXISTS public.rutinas CASCADE;
DROP TABLE IF EXISTS public.alumnos CASCADE;
DROP TABLE IF EXISTS public.tenant_users CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

DROP FUNCTION IF EXISTS public.get_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_alumno_id() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_is_trainer() CASCADE;
DROP FUNCTION IF EXISTS public.validate_nutrition_profile_plan_tenant() CASCADE;
DROP FUNCTION IF EXISTS public.sync_workout_log_completion() CASCADE;
DROP FUNCTION IF EXISTS public.update_modified_column() CASCADE;
DROP FUNCTION IF EXISTS public.default_nutrition_meta() CASCADE;
DROP FUNCTION IF EXISTS public.is_valid_nutrition_meta(JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.jsonb_is_array(JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.jsonb_is_object(JSONB) CASCADE;

DROP TYPE IF EXISTS public.pago_estado CASCADE;
DROP TYPE IF EXISTS public.alumno_estado CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
-- =============================================================================
-- Gym App bootstrap schema for Supabase
-- Production-oriented, tenant-safe, and compatible with the current frontend
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typnamespace = 'public'::regnamespace
          AND typname = 'app_role'
    ) THEN
        CREATE TYPE public.app_role AS ENUM ('entrenador', 'alumno');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typnamespace = 'public'::regnamespace
          AND typname = 'alumno_estado'
    ) THEN
        CREATE TYPE public.alumno_estado AS ENUM ('activo', 'inactivo', 'vencido');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typnamespace = 'public'::regnamespace
          AND typname = 'pago_estado'
    ) THEN
        CREATE TYPE public.pago_estado AS ENUM ('pendiente', 'pagado', 'vencido', 'cancelado');
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.jsonb_is_array(value JSONB)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT jsonb_typeof(value) = 'array';
$$;

CREATE OR REPLACE FUNCTION public.jsonb_is_object(value JSONB)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT jsonb_typeof(value) = 'object';
$$;

CREATE OR REPLACE FUNCTION public.default_nutrition_meta()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT jsonb_build_object(
        'calorias', 2000,
        'proteinas', 150,
        'carbos', 250,
        'grasas', 65
    );
$$;

CREATE OR REPLACE FUNCTION public.is_valid_nutrition_meta(value JSONB)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT
        public.jsonb_is_object(value)
        AND value ? 'calorias'
        AND value ? 'proteinas'
        AND value ? 'carbos'
        AND value ? 'grasas'
        AND jsonb_typeof(value -> 'calorias') = 'number'
        AND jsonb_typeof(value -> 'proteinas') = 'number'
        AND jsonb_typeof(value -> 'carbos') = 'number'
        AND jsonb_typeof(value -> 'grasas') = 'number'
        AND (value ->> 'calorias')::numeric >= 0
        AND (value ->> 'proteinas')::numeric >= 0
        AND (value ->> 'carbos')::numeric >= 0
        AND (value ->> 'grasas')::numeric >= 0;
$$;

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tenants_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE IF NOT EXISTS public.tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tenant_users_user_unique UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.alumnos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    plan TEXT,
    fecha_inicio DATE,
    estado public.alumno_estado NOT NULL DEFAULT 'activo',
    avatar TEXT,
    peso NUMERIC(6, 2),
    altura NUMERIC(5, 2),
    edad INTEGER,
    objetivo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT alumnos_nombre_not_blank CHECK (btrim(nombre) <> ''),
    CONSTRAINT alumnos_email_not_blank CHECK (email IS NULL OR btrim(email) <> ''),
    CONSTRAINT alumnos_telefono_not_blank CHECK (telefono IS NULL OR btrim(telefono) <> ''),
    CONSTRAINT alumnos_plan_not_blank CHECK (plan IS NULL OR btrim(plan) <> ''),
    CONSTRAINT alumnos_avatar_not_blank CHECK (avatar IS NULL OR btrim(avatar) <> ''),
    CONSTRAINT alumnos_objetivo_not_blank CHECK (objetivo IS NULL OR btrim(objetivo) <> ''),
    CONSTRAINT alumnos_peso_positive CHECK (peso IS NULL OR peso > 0),
    CONSTRAINT alumnos_altura_positive CHECK (altura IS NULL OR altura > 0),
    CONSTRAINT alumnos_edad_valid CHECK (edad IS NULL OR edad BETWEEN 0 AND 120),
    CONSTRAINT alumnos_tenant_id_id_unique UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS public.rutinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT,
    creador TEXT,
    dias JSONB NOT NULL DEFAULT '[]'::jsonb,
    asignaciones JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT rutinas_nombre_not_blank CHECK (btrim(nombre) <> ''),
    CONSTRAINT rutinas_descripcion_not_blank CHECK (descripcion IS NULL OR btrim(descripcion) <> ''),
    CONSTRAINT rutinas_tipo_not_blank CHECK (tipo IS NULL OR btrim(tipo) <> ''),
    CONSTRAINT rutinas_creador_not_blank CHECK (creador IS NULL OR btrim(creador) <> ''),
    CONSTRAINT rutinas_dias_is_array CHECK (public.jsonb_is_array(dias)),
    CONSTRAINT rutinas_asignaciones_is_array CHECK (public.jsonb_is_array(asignaciones)),
    CONSTRAINT rutinas_tenant_id_id_unique UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    alumno_id UUID NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    fecha DATE NOT NULL,
    mes TEXT NOT NULL,
    metodo TEXT,
    estado public.pago_estado NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pagos_monto_non_negative CHECK (monto >= 0),
    CONSTRAINT pagos_mes_not_blank CHECK (btrim(mes) <> ''),
    CONSTRAINT pagos_metodo_not_blank CHECK (metodo IS NULL OR btrim(metodo) <> ''),
    CONSTRAINT pagos_alumno_same_tenant_fkey FOREIGN KEY (tenant_id, alumno_id)
        REFERENCES public.alumnos(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.planes_nutricionales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    comidas JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT planes_nutricionales_nombre_not_blank CHECK (btrim(nombre) <> ''),
    CONSTRAINT planes_nutricionales_descripcion_not_blank CHECK (descripcion IS NULL OR btrim(descripcion) <> ''),
    CONSTRAINT planes_nutricionales_comidas_is_array CHECK (public.jsonb_is_array(comidas)),
    CONSTRAINT planes_nutricionales_tenant_id_id_unique UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS public.nutricion_perfiles (
    alumno_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    meta_diaria JSONB NOT NULL DEFAULT public.default_nutrition_meta(),
    plan_activo_id UUID REFERENCES public.planes_nutricionales(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT nutricion_perfiles_meta_diaria_valid CHECK (public.is_valid_nutrition_meta(meta_diaria)),
    CONSTRAINT nutricion_perfiles_alumno_same_tenant_fkey FOREIGN KEY (tenant_id, alumno_id)
        REFERENCES public.alumnos(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT nutricion_perfiles_tenant_alumno_unique UNIQUE (tenant_id, alumno_id)
);

CREATE TABLE IF NOT EXISTS public.nutricion_registros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    alumno_id UUID NOT NULL,
    fecha DATE NOT NULL,
    comidas JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT nutricion_registros_comidas_is_array CHECK (public.jsonb_is_array(comidas)),
    CONSTRAINT nutricion_registros_alumno_same_tenant_fkey FOREIGN KEY (tenant_id, alumno_id)
        REFERENCES public.alumnos(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT nutricion_registros_unique_day UNIQUE (tenant_id, alumno_id, fecha)
);

CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    alumno_id UUID NOT NULL,
    rutina_id UUID NOT NULL,
    day_index INTEGER NOT NULL,
    exercise_index INTEGER NOT NULL,
    set_index INTEGER NOT NULL,
    exercise_id TEXT NOT NULL,
    session_date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    actual_reps TEXT,
    actual_weight_kg TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT workout_logs_exercise_id_not_blank CHECK (btrim(exercise_id) <> ''),
    CONSTRAINT workout_logs_day_index_non_negative CHECK (day_index >= 0),
    CONSTRAINT workout_logs_exercise_index_non_negative CHECK (exercise_index >= 0),
    CONSTRAINT workout_logs_set_index_non_negative CHECK (set_index >= 0),
    CONSTRAINT workout_logs_completion_consistency CHECK (completed_at IS NULL OR completed = TRUE),
    CONSTRAINT workout_logs_alumno_same_tenant_fkey FOREIGN KEY (tenant_id, alumno_id)
        REFERENCES public.alumnos(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT workout_logs_rutina_same_tenant_fkey FOREIGN KEY (tenant_id, rutina_id)
        REFERENCES public.rutinas(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT workout_logs_unique_set UNIQUE (
        tenant_id,
        alumno_id,
        rutina_id,
        day_index,
        exercise_index,
        set_index,
        session_date
    )
);

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_workout_log_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
    IF COALESCE(NEW.completed, FALSE) THEN
        NEW.completed_at = COALESCE(NEW.completed_at, NOW());
    ELSE
        NEW.completed_at = NULL;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_nutrition_profile_plan_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
    IF NEW.plan_activo_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.planes_nutricionales plan
        WHERE plan.id = NEW.plan_activo_id
          AND plan.tenant_id = NEW.tenant_id
    ) THEN
        RAISE EXCEPTION 'plan_activo_id must belong to the same tenant as the nutrition profile';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
    SELECT tenant_id
    FROM public.tenant_users
    WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
    SELECT role
    FROM public.tenant_users
    WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_alumno_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
    SELECT alumno.id
    FROM public.alumnos AS alumno
    WHERE alumno.user_id = auth.uid()
      AND alumno.tenant_id = public.get_current_user_tenant_id();
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_trainer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
    SELECT COALESCE(
        public.get_current_user_role() = 'entrenador'::public.app_role,
        FALSE
    );
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
    SELECT public.get_current_user_tenant_id();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
    SELECT public.get_current_user_role()::TEXT;
$$;

REVOKE ALL ON FUNCTION public.get_current_user_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_alumno_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_trainer() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_current_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_alumno_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_trainer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_tenant_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_current_alumno_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_trainer() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO service_role;

DROP TRIGGER IF EXISTS update_tenants_modtime ON public.tenants;
DROP TRIGGER IF EXISTS update_tenant_users_modtime ON public.tenant_users;
DROP TRIGGER IF EXISTS update_alumnos_modtime ON public.alumnos;
DROP TRIGGER IF EXISTS update_rutinas_modtime ON public.rutinas;
DROP TRIGGER IF EXISTS update_pagos_modtime ON public.pagos;
DROP TRIGGER IF EXISTS update_planes_nutricionales_modtime ON public.planes_nutricionales;
DROP TRIGGER IF EXISTS update_nutricion_perfiles_modtime ON public.nutricion_perfiles;
DROP TRIGGER IF EXISTS update_nutricion_registros_modtime ON public.nutricion_registros;
DROP TRIGGER IF EXISTS update_workout_logs_modtime ON public.workout_logs;
DROP TRIGGER IF EXISTS sync_workout_logs_completion ON public.workout_logs;
DROP TRIGGER IF EXISTS validate_nutrition_profile_plan_tenant ON public.nutricion_perfiles;

CREATE TRIGGER update_tenants_modtime
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_tenant_users_modtime
BEFORE UPDATE ON public.tenant_users
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_alumnos_modtime
BEFORE UPDATE ON public.alumnos
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_rutinas_modtime
BEFORE UPDATE ON public.rutinas
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_pagos_modtime
BEFORE UPDATE ON public.pagos
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_planes_nutricionales_modtime
BEFORE UPDATE ON public.planes_nutricionales
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_nutricion_perfiles_modtime
BEFORE UPDATE ON public.nutricion_perfiles
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_nutricion_registros_modtime
BEFORE UPDATE ON public.nutricion_registros
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_workout_logs_modtime
BEFORE UPDATE ON public.workout_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER sync_workout_logs_completion
BEFORE INSERT OR UPDATE ON public.workout_logs
FOR EACH ROW
EXECUTE FUNCTION public.sync_workout_log_completion();

CREATE TRIGGER validate_nutrition_profile_plan_tenant
BEFORE INSERT OR UPDATE ON public.nutricion_perfiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_nutrition_profile_plan_tenant();

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rutinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes_nutricionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutricion_perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutricion_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.rutinas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pagos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.planes_nutricionales FORCE ROW LEVEL SECURITY;
ALTER TABLE public.nutricion_perfiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.nutricion_registros FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
DROP POLICY IF EXISTS tenants_select_policy ON public.tenants;

DROP POLICY IF EXISTS "Users can query their tenant mapping" ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_select_policy ON public.tenant_users;

DROP POLICY IF EXISTS "Tenant isolation for alumnos (SELECT)" ON public.alumnos;
DROP POLICY IF EXISTS "Tenant isolation for alumnos (INSERT)" ON public.alumnos;
DROP POLICY IF EXISTS "Tenant isolation for alumnos (UPDATE)" ON public.alumnos;
DROP POLICY IF EXISTS "Tenant isolation for alumnos (DELETE)" ON public.alumnos;
DROP POLICY IF EXISTS "Alumnos select policy" ON public.alumnos;
DROP POLICY IF EXISTS "Alumnos all policy (Entrenadores)" ON public.alumnos;
DROP POLICY IF EXISTS alumnos_select_policy ON public.alumnos;
DROP POLICY IF EXISTS alumnos_write_policy ON public.alumnos;

DROP POLICY IF EXISTS "Tenant isolation for rutinas (SELECT)" ON public.rutinas;
DROP POLICY IF EXISTS "Tenant isolation for rutinas (INSERT)" ON public.rutinas;
DROP POLICY IF EXISTS "Tenant isolation for rutinas (UPDATE)" ON public.rutinas;
DROP POLICY IF EXISTS "Tenant isolation for rutinas (DELETE)" ON public.rutinas;
DROP POLICY IF EXISTS "Rutinas select" ON public.rutinas;
DROP POLICY IF EXISTS "Rutinas all (Entrenadores)" ON public.rutinas;
DROP POLICY IF EXISTS rutinas_select_policy ON public.rutinas;
DROP POLICY IF EXISTS rutinas_write_policy ON public.rutinas;

DROP POLICY IF EXISTS "Tenant isolation for pagos" ON public.pagos;
DROP POLICY IF EXISTS "Pagos select" ON public.pagos;
DROP POLICY IF EXISTS "Pagos all (Entrenadores)" ON public.pagos;
DROP POLICY IF EXISTS pagos_select_policy ON public.pagos;
DROP POLICY IF EXISTS pagos_write_policy ON public.pagos;

DROP POLICY IF EXISTS "Tenant isolation for planes_nutricionales" ON public.planes_nutricionales;
DROP POLICY IF EXISTS "Planes Nutricionales select" ON public.planes_nutricionales;
DROP POLICY IF EXISTS "Planes Nutricionales all (Entrenadores)" ON public.planes_nutricionales;
DROP POLICY IF EXISTS planes_nutricionales_select_policy ON public.planes_nutricionales;
DROP POLICY IF EXISTS planes_nutricionales_write_policy ON public.planes_nutricionales;

DROP POLICY IF EXISTS "Tenant isolation for nutricion_perfiles" ON public.nutricion_perfiles;
DROP POLICY IF EXISTS "Nutricion Perfiles All" ON public.nutricion_perfiles;
DROP POLICY IF EXISTS nutricion_perfiles_select_policy ON public.nutricion_perfiles;
DROP POLICY IF EXISTS nutricion_perfiles_write_policy ON public.nutricion_perfiles;

DROP POLICY IF EXISTS "Tenant isolation for nutricion_registros" ON public.nutricion_registros;
DROP POLICY IF EXISTS "Nutricion Perfiles/Registros All" ON public.nutricion_registros;
DROP POLICY IF EXISTS nutricion_registros_rw_policy ON public.nutricion_registros;

DROP POLICY IF EXISTS "Tenant isolation for workout_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Workout select/insert/update" ON public.workout_logs;
DROP POLICY IF EXISTS workout_logs_rw_policy ON public.workout_logs;

CREATE POLICY tenants_select_policy
ON public.tenants
FOR SELECT
TO authenticated
USING (id = (SELECT public.get_current_user_tenant_id()));

CREATE POLICY tenant_users_select_policy
ON public.tenant_users
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY alumnos_select_policy
ON public.alumnos
FOR SELECT
TO authenticated
USING (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (
        (SELECT public.current_user_is_trainer())
        OR user_id = (SELECT auth.uid())
    )
);

CREATE POLICY alumnos_write_policy
ON public.alumnos
FOR ALL
TO authenticated
USING (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (SELECT public.current_user_is_trainer())
)
WITH CHECK (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (SELECT public.current_user_is_trainer())
);

CREATE POLICY rutinas_select_policy
ON public.rutinas
FOR SELECT
TO authenticated
USING (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (
        (SELECT public.current_user_is_trainer())
        OR (
            (SELECT public.get_current_alumno_id()) IS NOT NULL
            AND asignaciones @> jsonb_build_array(((SELECT public.get_current_alumno_id()))::TEXT)
        )
    )
);

CREATE POLICY rutinas_write_policy
ON public.rutinas
FOR ALL
TO authenticated
USING (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (SELECT public.current_user_is_trainer())
)
WITH CHECK (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (SELECT public.current_user_is_trainer())
);

CREATE POLICY pagos_select_policy
ON public.pagos
FOR SELECT
TO authenticated
USING (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (
        (SELECT public.current_user_is_trainer())
        OR alumno_id = (SELECT public.get_current_alumno_id())
    )
);

CREATE POLICY pagos_write_policy
ON public.pagos
FOR ALL
TO authenticated
USING (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (SELECT public.current_user_is_trainer())
)
WITH CHECK (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (SELECT public.current_user_is_trainer())
);

CREATE POLICY planes_nutricionales_select_policy
ON public.planes_nutricionales
FOR SELECT
TO authenticated
USING (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (
        (SELECT public.current_user_is_trainer())
        OR EXISTS (
            SELECT 1
            FROM public.nutricion_perfiles AS perfil
            WHERE perfil.tenant_id = (SELECT public.get_current_user_tenant_id())
              AND perfil.alumno_id = (SELECT public.get_current_alumno_id())
              AND perfil.plan_activo_id = public.planes_nutricionales.id
        )
    )
);

CREATE POLICY planes_nutricionales_write_policy
ON public.planes_nutricionales
FOR ALL
TO authenticated
USING (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (SELECT public.current_user_is_trainer())
)
WITH CHECK (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (SELECT public.current_user_is_trainer())
);

CREATE POLICY nutricion_perfiles_select_policy
ON public.nutricion_perfiles
FOR SELECT
TO authenticated
USING (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (
        (SELECT public.current_user_is_trainer())
        OR alumno_id = (SELECT public.get_current_alumno_id())
    )
);

CREATE POLICY nutricion_perfiles_write_policy
ON public.nutricion_perfiles
FOR ALL
TO authenticated
USING (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (SELECT public.current_user_is_trainer())
)
WITH CHECK (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (SELECT public.current_user_is_trainer())
);

CREATE POLICY nutricion_registros_rw_policy
ON public.nutricion_registros
FOR ALL
TO authenticated
USING (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (
        (SELECT public.current_user_is_trainer())
        OR alumno_id = (SELECT public.get_current_alumno_id())
    )
)
WITH CHECK (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (
        (SELECT public.current_user_is_trainer())
        OR alumno_id = (SELECT public.get_current_alumno_id())
    )
);

CREATE POLICY workout_logs_rw_policy
ON public.workout_logs
FOR ALL
TO authenticated
USING (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (
        (SELECT public.current_user_is_trainer())
        OR alumno_id = (SELECT public.get_current_alumno_id())
    )
)
WITH CHECK (
    tenant_id = (SELECT public.get_current_user_tenant_id())
    AND (
        (SELECT public.current_user_is_trainer())
        OR alumno_id = (SELECT public.get_current_alumno_id())
    )
);

REVOKE ALL ON TABLE public.tenants FROM anon;
REVOKE ALL ON TABLE public.tenant_users FROM anon;
REVOKE ALL ON TABLE public.alumnos FROM anon;
REVOKE ALL ON TABLE public.rutinas FROM anon;
REVOKE ALL ON TABLE public.pagos FROM anon;
REVOKE ALL ON TABLE public.planes_nutricionales FROM anon;
REVOKE ALL ON TABLE public.nutricion_perfiles FROM anon;
REVOKE ALL ON TABLE public.nutricion_registros FROM anon;
REVOKE ALL ON TABLE public.workout_logs FROM anon;

GRANT SELECT ON TABLE public.tenants TO authenticated;
GRANT SELECT ON TABLE public.tenant_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.alumnos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rutinas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pagos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.planes_nutricionales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nutricion_perfiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nutricion_registros TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.workout_logs TO authenticated;

GRANT ALL PRIVILEGES ON TABLE public.tenants TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.tenant_users TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.alumnos TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.rutinas TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.pagos TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.planes_nutricionales TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.nutricion_perfiles TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.nutricion_registros TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.workout_logs TO service_role;

GRANT USAGE ON TYPE public.app_role TO authenticated, service_role;
GRANT USAGE ON TYPE public.alumno_estado TO authenticated, service_role;
GRANT USAGE ON TYPE public.pago_estado TO authenticated, service_role;

CREATE UNIQUE INDEX IF NOT EXISTS idx_alumnos_user_id_unique
    ON public.alumnos(user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_alumnos_tenant_id
    ON public.alumnos(tenant_id);

CREATE INDEX IF NOT EXISTS idx_alumnos_tenant_estado
    ON public.alumnos(tenant_id, estado);

CREATE INDEX IF NOT EXISTS idx_rutinas_tenant_id
    ON public.rutinas(tenant_id);

CREATE INDEX IF NOT EXISTS idx_rutinas_asignaciones_gin
    ON public.rutinas
    USING GIN (asignaciones jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_pagos_tenant_alumno_fecha
    ON public.pagos(tenant_id, alumno_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_pagos_tenant_estado_fecha
    ON public.pagos(tenant_id, estado, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_planes_nutricionales_tenant_id
    ON public.planes_nutricionales(tenant_id);

CREATE INDEX IF NOT EXISTS idx_nutricion_perfiles_tenant_plan_id
    ON public.nutricion_perfiles(tenant_id, plan_activo_id);

CREATE INDEX IF NOT EXISTS idx_nutricion_registros_tenant_alumno_fecha
    ON public.nutricion_registros(tenant_id, alumno_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_workout_logs_tenant_alumno_session_date
    ON public.workout_logs(tenant_id, alumno_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_workout_logs_tenant_rutina_session_date
    ON public.workout_logs(tenant_id, rutina_id, session_date DESC);

COMMIT;



