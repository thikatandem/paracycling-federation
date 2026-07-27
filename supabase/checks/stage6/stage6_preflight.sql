-- READ-ONLY preflight for Stage 6. This file makes no changes.
WITH required_tables(name) AS (
  VALUES
    ('department_master'),
    ('position_master'),
    ('staff_registry'),
    ('staff_assignments'),
    ('staff_qualifications'),
    ('staff_certifications'),
    ('staff_reviews'),
    ('profiles'),
    ('role_master'),
    ('user_role_master'),
    ('permission_master'),
    ('role_permissions'),
    ('user_permissions'),
    ('module_permissions')
)
SELECT
  required_tables.name,
  CASE
    WHEN to_regclass('public.' || required_tables.name) IS NOT NULL
      THEN 'OK'
    ELSE 'MISSING'
  END AS status
FROM required_tables
ORDER BY required_tables.name;

SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'staff_registry' AND column_name IN ('staff_id', 'department_id', 'profile_id', 'role_id'))
    OR
    (table_name = 'profiles' AND column_name IN ('profile_id', 'user_role_id', 'auth_user_id', 'portal_enabled'))
    OR
    (table_name = 'staff_assignments' AND column_name IN ('assignment_id', 'staff_id', 'role_id', 'team_id'))
  )
ORDER BY table_name, column_name;
