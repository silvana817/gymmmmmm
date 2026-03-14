-- WARNING:
-- Local development only.
-- This script irreversibly deletes the Gym App schema objects and data.

DROP TABLE IF EXISTS public.workout_logs CASCADE;
DROP TABLE IF EXISTS public.nutricion_registros CASCADE;
DROP TABLE IF EXISTS public.nutricion_perfiles CASCADE;
DROP TABLE IF EXISTS public.planes_nutricionales CASCADE;
DROP TABLE IF EXISTS public.pagos CASCADE;
DROP TABLE IF EXISTS public.rutinas CASCADE;
DROP TABLE IF EXISTS public.alumnos CASCADE;
DROP TABLE IF EXISTS public.tenant_users CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_is_trainer() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_alumno_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.validate_nutrition_profile_plan_tenant() CASCADE;
DROP FUNCTION IF EXISTS public.sync_workout_log_completion() CASCADE;
DROP FUNCTION IF EXISTS public.update_modified_column() CASCADE;
DROP FUNCTION IF EXISTS public.is_valid_nutrition_meta(JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.default_nutrition_meta() CASCADE;
DROP FUNCTION IF EXISTS public.jsonb_is_object(JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.jsonb_is_array(JSONB) CASCADE;

DROP TYPE IF EXISTS public.pago_estado CASCADE;
DROP TYPE IF EXISTS public.alumno_estado CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
