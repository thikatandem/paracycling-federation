-- READ-ONLY post-migration verification for Stage 6.
WITH expected_tables(name) AS (
  VALUES
    ('department_access_policy'),
    ('department_permission_overrides'),
    ('department_module_overrides'),
    ('staff_access_settings'),
    ('profile_permission_overrides'),
    ('profile_module_overrides'),
    ('review_template_master'),
    ('review_criteria_master'),
    ('staff_review_ratings')
)
SELECT
  expected_tables.name,
  CASE
    WHEN to_regclass('public.' || expected_tables.name) IS NOT NULL
      THEN 'OK'
    ELSE 'MISSING'
  END AS status
FROM expected_tables
ORDER BY expected_tables.name;

SELECT
  p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n
  ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'replace_user_role_access',
    'sync_one_staff_profile_access',
    'trg_sync_staff_profile_access',
    'trg_sync_access_setting_profile',
    'trg_sync_department_policy_profiles',
    'validate_staff_review_rating'
  )
ORDER BY p.proname;

SELECT
  event_object_table AS table_name,
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trg_staff_registry_sync_access',
    'trg_staff_access_settings_sync_profile',
    'trg_department_access_policy_sync_profiles',
    'trg_validate_staff_review_rating'
  )
ORDER BY trigger_name, event_manipulation;

SELECT
  conname,
  pg_get_constraintdef(oid) AS definition,
  convalidated
FROM pg_constraint
WHERE conname = 'staff_assignments_no_team_roles';
