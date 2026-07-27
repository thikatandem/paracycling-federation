-- Stage 6: Department-first access control and comprehensive staff reviews
-- ParaCycling Federation Management System
--
-- Safe design goals:
--   * Department is the default access-policy owner.
--   * Access roles use user_role_master (authentication/access roles), not role_master.
--   * role_master remains the operational/federation job-role catalogue.
--   * No new team-scoped staff role assignments are allowed.
--   * Department defaults can be overridden at profile level, including explicit DENY.
--   * Existing staff_assignments rows are preserved as legacy history.
--   * Review criteria are template-driven; no federation-specific rubric is guessed.

BEGIN;

-- ============================================================
-- DEPARTMENT ACCESS POLICY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.department_access_policy (
  department_id uuid PRIMARY KEY
    REFERENCES public.department_master(department_id) ON DELETE CASCADE,
  user_role_id uuid NOT NULL
    REFERENCES public.user_role_master(user_role_id),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(profile_id),
  updated_by uuid REFERENCES public.profiles(profile_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.department_permission_overrides (
  department_id uuid NOT NULL
    REFERENCES public.department_master(department_id) ON DELETE CASCADE,
  permission_id uuid NOT NULL
    REFERENCES public.permission_master(permission_id) ON DELETE CASCADE,
  is_allowed boolean NOT NULL,
  created_by uuid REFERENCES public.profiles(profile_id),
  updated_by uuid REFERENCES public.profiles(profile_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (department_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.department_module_overrides (
  department_id uuid NOT NULL
    REFERENCES public.department_master(department_id) ON DELETE CASCADE,
  module_code varchar NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_update boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(profile_id),
  updated_by uuid REFERENCES public.profiles(profile_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (department_id, module_code)
);

-- ============================================================
-- PROFILE-SPECIFIC ACCESS CUSTOMIZATION
-- ============================================================

CREATE TABLE IF NOT EXISTS public.staff_access_settings (
  profile_id uuid PRIMARY KEY
    REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
  inherit_department_role boolean NOT NULL DEFAULT true,
  user_role_id_override uuid
    REFERENCES public.user_role_master(user_role_id),
  created_by uuid REFERENCES public.profiles(profile_id),
  updated_by uuid REFERENCES public.profiles(profile_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_access_settings_role_check CHECK (
    (inherit_department_role = true AND user_role_id_override IS NULL)
    OR
    (inherit_department_role = false AND user_role_id_override IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.profile_permission_overrides (
  profile_id uuid NOT NULL
    REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
  permission_id uuid NOT NULL
    REFERENCES public.permission_master(permission_id) ON DELETE CASCADE,
  is_allowed boolean NOT NULL,
  created_by uuid REFERENCES public.profiles(profile_id),
  updated_by uuid REFERENCES public.profiles(profile_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.profile_module_overrides (
  profile_id uuid NOT NULL
    REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
  module_code varchar NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_update boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(profile_id),
  updated_by uuid REFERENCES public.profiles(profile_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, module_code)
);

CREATE INDEX IF NOT EXISTS idx_staff_registry_department_profile
  ON public.staff_registry(department_id, profile_id);

CREATE INDEX IF NOT EXISTS idx_department_permission_overrides_department
  ON public.department_permission_overrides(department_id);

CREATE INDEX IF NOT EXISTS idx_profile_permission_overrides_profile
  ON public.profile_permission_overrides(profile_id);

-- ============================================================
-- ATOMIC ACCESS-ROLE DEFINITION REPLACEMENT
-- Role definitions are the reusable baseline. Department and profile layers
-- store only their deviations from this baseline.
-- ============================================================

CREATE OR REPLACE FUNCTION public.replace_user_role_access(
  p_user_role_id uuid,
  p_permission_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_modules jsonb DEFAULT '[]'::jsonb,
  p_actor uuid DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_role_master urm
    WHERE urm.user_role_id = p_user_role_id
  ) THEN
    RAISE EXCEPTION 'Access role not found.';
  END IF;

  DELETE FROM public.role_permissions
  WHERE user_role_id = p_user_role_id;

  INSERT INTO public.role_permissions (
    user_role_id,
    permission_id,
    created_by
  )
  SELECT
    p_user_role_id,
    permission_id,
    p_actor
  FROM (
    SELECT DISTINCT unnest(
      COALESCE(p_permission_ids, ARRAY[]::uuid[])
    ) AS permission_id
  ) source
  WHERE EXISTS (
    SELECT 1
    FROM public.permission_master pm
    WHERE pm.permission_id = source.permission_id
      AND pm.is_active = true
  );

  DELETE FROM public.module_permissions
  WHERE user_role_id = p_user_role_id;

  INSERT INTO public.module_permissions (
    user_role_id,
    module_code,
    can_view,
    can_create,
    can_update,
    can_delete
  )
  SELECT
    p_user_role_id,
    module_code,
    COALESCE(can_view, false),
    COALESCE(can_create, false),
    COALESCE(can_update, false),
    COALESCE(can_delete, false)
  FROM jsonb_to_recordset(
    COALESCE(p_modules, '[]'::jsonb)
  ) AS module_row(
    module_code text,
    can_view boolean,
    can_create boolean,
    can_update boolean,
    can_delete boolean
  )
  WHERE NULLIF(trim(module_code), '') IS NOT NULL;
END;
$$;

-- ============================================================
-- DATABASE-LEVEL DEPARTMENT ROLE SYNCHRONIZATION
-- The department remains authoritative even when staff/profile/policy rows
-- are changed outside the browser UI. Explicit individual role overrides win.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_one_staff_profile_access(
  p_profile_id uuid,
  p_department_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_inherit boolean := true;
  v_override_role uuid := null;
  v_department_role uuid := null;
BEGIN
  IF p_profile_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    sas.inherit_department_role,
    sas.user_role_id_override
  INTO
    v_inherit,
    v_override_role
  FROM public.staff_access_settings sas
  WHERE sas.profile_id = p_profile_id;

  IF NOT FOUND THEN
    v_inherit := true;
    v_override_role := null;
  END IF;

  IF v_inherit = false THEN
    UPDATE public.profiles
    SET user_role_id = v_override_role
    WHERE profile_id = p_profile_id;
    RETURN;
  END IF;

  SELECT dap.user_role_id
  INTO v_department_role
  FROM public.department_access_policy dap
  WHERE dap.department_id = p_department_id
    AND dap.is_active = true;

  UPDATE public.profiles
  SET user_role_id = v_department_role
  WHERE profile_id = p_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_staff_profile_access()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.sync_one_staff_profile_access(
    NEW.profile_id,
    NEW.department_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_staff_registry_sync_access
  ON public.staff_registry;
CREATE TRIGGER trg_staff_registry_sync_access
AFTER INSERT OR UPDATE OF department_id, profile_id
ON public.staff_registry
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_staff_profile_access();

CREATE OR REPLACE FUNCTION public.trg_sync_access_setting_profile()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_department_id uuid;
  v_profile_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_profile_id := OLD.profile_id;
  ELSE
    v_profile_id := NEW.profile_id;
  END IF;

  SELECT sr.department_id
  INTO v_department_id
  FROM public.staff_registry sr
  WHERE sr.profile_id = v_profile_id;

  PERFORM public.sync_one_staff_profile_access(
    v_profile_id,
    v_department_id
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_staff_access_settings_sync_profile
  ON public.staff_access_settings;
CREATE TRIGGER trg_staff_access_settings_sync_profile
AFTER INSERT OR UPDATE OR DELETE
ON public.staff_access_settings
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_access_setting_profile();

CREATE OR REPLACE FUNCTION public.trg_sync_department_policy_profiles()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_department_id uuid;
  v_role_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_department_id := OLD.department_id;
    v_role_id := null;
  ELSE
    v_department_id := NEW.department_id;
    v_role_id :=
      CASE
        WHEN NEW.is_active = true
          THEN NEW.user_role_id
        ELSE null
      END;
  END IF;

  UPDATE public.profiles p
  SET user_role_id = v_role_id
  WHERE EXISTS (
    SELECT 1
    FROM public.staff_registry sr
    LEFT JOIN public.staff_access_settings sas
      ON sas.profile_id = sr.profile_id
    WHERE sr.profile_id = p.profile_id
      AND sr.department_id = v_department_id
      AND COALESCE(sas.inherit_department_role, true) = true
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_department_access_policy_sync_profiles
  ON public.department_access_policy;
CREATE TRIGGER trg_department_access_policy_sync_profiles
AFTER INSERT OR UPDATE OF user_role_id, is_active OR DELETE
ON public.department_access_policy
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_department_policy_profiles();

-- ============================================================
-- PREVENT NEW TEAM-SCOPED STAFF ROLE ASSIGNMENTS
-- Existing legacy rows are intentionally preserved.
-- NOT VALID means old rows are not retroactively rejected, while new/updated
-- rows must satisfy the rule.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'staff_assignments_no_team_roles'
  ) THEN
    ALTER TABLE public.staff_assignments
      ADD CONSTRAINT staff_assignments_no_team_roles
      CHECK (team_id IS NULL) NOT VALID;
  END IF;
END $$;

COMMENT ON COLUMN public.staff_assignments.team_id IS
  'LEGACY HISTORY ONLY. New team-scoped staff role assignments are prohibited. Department access policy is authoritative for system access.';

-- ============================================================
-- QUALIFICATION / CERTIFICATION RECORD DEPTH
-- These are neutral factual fields only; no accreditation taxonomy is guessed.
-- ============================================================

ALTER TABLE public.staff_qualifications
  ADD COLUMN IF NOT EXISTS qualification_level varchar,
  ADD COLUMN IF NOT EXISTS field_of_study varchar,
  ADD COLUMN IF NOT EXISTS credential_number varchar,
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.staff_certifications
  ADD COLUMN IF NOT EXISTS certification_type varchar,
  ADD COLUMN IF NOT EXISTS credential_number varchar,
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS renewal_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text;

-- ============================================================
-- REVIEW TEMPLATES AND CRITERIA
-- Federation administrators define the rubric; the migration does not seed
-- generic criteria.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.review_template_master (
  review_template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code varchar NOT NULL UNIQUE,
  template_name varchar NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(profile_id),
  updated_by uuid REFERENCES public.profiles(profile_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.review_criteria_master (
  review_criterion_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_template_id uuid NOT NULL
    REFERENCES public.review_template_master(review_template_id) ON DELETE CASCADE,
  criterion_code varchar NOT NULL,
  criterion_name varchar NOT NULL,
  description text,
  weight numeric NOT NULL DEFAULT 1 CHECK (weight > 0),
  max_score numeric NOT NULL DEFAULT 5 CHECK (max_score > 0),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(profile_id),
  updated_by uuid REFERENCES public.profiles(profile_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_template_id, criterion_code)
);

ALTER TABLE public.staff_reviews
  ADD COLUMN IF NOT EXISTS review_template_id uuid
    REFERENCES public.review_template_master(review_template_id),
  ADD COLUMN IF NOT EXISTS review_period_start date,
  ADD COLUMN IF NOT EXISTS review_period_end date,
  ADD COLUMN IF NOT EXISTS reviewer_profile_id uuid
    REFERENCES public.profiles(profile_id),
  ADD COLUMN IF NOT EXISTS review_status varchar NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS strengths text,
  ADD COLUMN IF NOT EXISTS improvement_areas text,
  ADD COLUMN IF NOT EXISTS goals text,
  ADD COLUMN IF NOT EXISTS training_needs text,
  ADD COLUMN IF NOT EXISTS employee_comments text,
  ADD COLUMN IF NOT EXISTS next_review_date date,
  ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;

CREATE TABLE IF NOT EXISTS public.staff_review_ratings (
  staff_review_rating_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL
    REFERENCES public.staff_reviews(review_id) ON DELETE CASCADE,
  review_criterion_id uuid NOT NULL
    REFERENCES public.review_criteria_master(review_criterion_id),
  score numeric NOT NULL CHECK (score >= 0),
  comments text,
  created_by uuid REFERENCES public.profiles(profile_id),
  updated_by uuid REFERENCES public.profiles(profile_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, review_criterion_id)
);

-- Database guard: a rating must belong to the review's selected template and
-- cannot exceed the criterion's configured scoring scale.
CREATE OR REPLACE FUNCTION public.validate_staff_review_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_review_template_id uuid;
  v_criterion_template_id uuid;
  v_max_score numeric;
BEGIN
  SELECT sr.review_template_id
  INTO v_review_template_id
  FROM public.staff_reviews sr
  WHERE sr.review_id = NEW.review_id;

  SELECT
    rc.review_template_id,
    rc.max_score
  INTO
    v_criterion_template_id,
    v_max_score
  FROM public.review_criteria_master rc
  WHERE rc.review_criterion_id = NEW.review_criterion_id;

  IF v_review_template_id IS NULL
     OR v_criterion_template_id IS NULL
     OR v_review_template_id <> v_criterion_template_id THEN
    RAISE EXCEPTION
      'Review criterion does not belong to the review template.';
  END IF;

  IF NEW.score < 0 OR NEW.score > v_max_score THEN
    RAISE EXCEPTION
      'Review score % is outside the allowed range 0..%.',
      NEW.score,
      v_max_score;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_staff_review_rating
  ON public.staff_review_ratings;
CREATE TRIGGER trg_validate_staff_review_rating
BEFORE INSERT OR UPDATE OF review_id, review_criterion_id, score
ON public.staff_review_ratings
FOR EACH ROW
EXECUTE FUNCTION public.validate_staff_review_rating();

CREATE INDEX IF NOT EXISTS idx_review_criteria_template
  ON public.review_criteria_master(review_template_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_staff_reviews_staff_date
  ON public.staff_reviews(staff_id, review_date DESC);

CREATE INDEX IF NOT EXISTS idx_staff_review_ratings_review
  ON public.staff_review_ratings(review_id);

COMMIT;
