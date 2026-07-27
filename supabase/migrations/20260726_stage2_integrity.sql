-- Stage 2 integrity guards.
-- Non-destructive: every block aborts if existing duplicates need manual review.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.participant_registry
    GROUP BY participant_type_id, source_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate participant_registry source mappings exist. Resolve them before applying the unique constraint.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_participant_registry_source'
      AND conrelid = 'public.participant_registry'::regclass
  ) THEN
    ALTER TABLE public.participant_registry
      ADD CONSTRAINT uq_participant_registry_source
      UNIQUE (participant_type_id, source_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.participant_instances
    GROUP BY event_instance_id, program_id, participant_ref_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate participant_instances registrations exist. Resolve them before applying the unique constraint.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_participant_instances_registration'
      AND conrelid = 'public.participant_instances'::regclass
  ) THEN
    ALTER TABLE public.participant_instances
      ADD CONSTRAINT uq_participant_instances_registration
      UNIQUE (event_instance_id, program_id, participant_ref_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.events
    GROUP BY event_name, event_type_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate event master identities exist. Resolve them before applying the unique constraint.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_events_name_type'
      AND conrelid = 'public.events'::regclass
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT uq_events_name_type
      UNIQUE (event_name, event_type_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.event_instances
    GROUP BY event_id, event_area, start_date, start_time
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate event occurrence identities exist. Resolve them before applying the unique constraint.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_event_instances_import_identity'
      AND conrelid = 'public.event_instances'::regclass
  ) THEN
    ALTER TABLE public.event_instances
      ADD CONSTRAINT uq_event_instances_import_identity
      UNIQUE (event_id, event_area, start_date, start_time);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.training_log
    WHERE event_instance_id IS NOT NULL
      AND program_id IS NOT NULL
      AND participant_instance_id IS NOT NULL
    GROUP BY event_instance_id, program_id, participant_instance_id, training_date, session_type
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate training_log activity identities exist. Resolve them before applying the unique constraint.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_training_log_activity_identity'
      AND conrelid = 'public.training_log'::regclass
  ) THEN
    ALTER TABLE public.training_log
      ADD CONSTRAINT uq_training_log_activity_identity
      UNIQUE (event_instance_id, program_id, participant_instance_id, training_date, session_type);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.race_results
    WHERE event_instance_id IS NOT NULL
      AND program_id IS NOT NULL
      AND participant_instance_id IS NOT NULL
    GROUP BY event_instance_id, program_id, participant_instance_id, competition_date, session_type
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate race_results activity identities exist. Resolve them before applying the unique constraint.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_race_results_activity_identity'
      AND conrelid = 'public.race_results'::regclass
  ) THEN
    ALTER TABLE public.race_results
      ADD CONSTRAINT uq_race_results_activity_identity
      UNIQUE (event_instance_id, program_id, participant_instance_id, competition_date, session_type);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT training_id
    FROM public.performance
    WHERE source_type = 'TRAINING'
      AND training_id IS NOT NULL
    GROUP BY training_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate TRAINING performance sources exist. Resolve them before applying the unique index.';
  END IF;

  IF EXISTS (
    SELECT result_id
    FROM public.performance
    WHERE source_type = 'COMPETITION'
      AND result_id IS NOT NULL
    GROUP BY result_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate COMPETITION performance sources exist. Resolve them before applying the unique index.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_performance_training_source
  ON public.performance (training_id)
  WHERE source_type = 'TRAINING' AND training_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_performance_competition_source
  ON public.performance (result_id)
  WHERE source_type = 'COMPETITION' AND result_id IS NOT NULL;

-- Complete relationships already represented by existing *_id columns.
-- Each block validates current data first; no rows are changed or deleted.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.event_programs ep
    LEFT JOIN public.program_master pm
      ON pm.program_id = ep.program_id
    WHERE pm.program_id IS NULL
  ) THEN
    RAISE EXCEPTION 'event_programs contains program_id values that do not exist in program_master.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.event_programs
    GROUP BY event_id, program_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate event/program assignments exist in event_programs. Resolve them before applying the unique constraint.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_event_programs_event_program'
      AND conrelid = 'public.event_programs'::regclass
  ) THEN
    ALTER TABLE public.event_programs
      ADD CONSTRAINT uq_event_programs_event_program
      UNIQUE (event_id, program_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.training_log t
    LEFT JOIN public.program_master p
      ON p.program_id = t.program_id
    WHERE t.program_id IS NOT NULL
      AND p.program_id IS NULL
  ) THEN
    RAISE EXCEPTION 'training_log contains invalid program_id values.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_training_program'
      AND conrelid = 'public.training_log'::regclass
  ) THEN
    ALTER TABLE public.training_log
      ADD CONSTRAINT fk_training_program
      FOREIGN KEY (program_id)
      REFERENCES public.program_master(program_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.race_results r
    LEFT JOIN public.program_master p
      ON p.program_id = r.program_id
    WHERE r.program_id IS NOT NULL
      AND p.program_id IS NULL
  ) THEN
    RAISE EXCEPTION 'race_results contains invalid program_id values.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_race_results_program'
      AND conrelid = 'public.race_results'::regclass
  ) THEN
    ALTER TABLE public.race_results
      ADD CONSTRAINT fk_race_results_program
      FOREIGN KEY (program_id)
      REFERENCES public.program_master(program_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.event_instances ei
    LEFT JOIN public.program_master p
      ON p.program_id = ei.program_id
    WHERE ei.program_id IS NOT NULL
      AND p.program_id IS NULL
  ) THEN
    RAISE EXCEPTION 'event_instances contains invalid program_id values.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_event_instances_program'
      AND conrelid = 'public.event_instances'::regclass
  ) THEN
    ALTER TABLE public.event_instances
      ADD CONSTRAINT fk_event_instances_program
      FOREIGN KEY (program_id)
      REFERENCES public.program_master(program_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.event_participants ep
    LEFT JOIN public.program_master p
      ON p.program_id = ep.program_id
    WHERE ep.program_id IS NOT NULL
      AND p.program_id IS NULL
  ) THEN
    RAISE EXCEPTION 'event_participants contains invalid program_id values.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_event_participants_program'
      AND conrelid = 'public.event_participants'::regclass
  ) THEN
    ALTER TABLE public.event_participants
      ADD CONSTRAINT fk_event_participants_program
      FOREIGN KEY (program_id)
      REFERENCES public.program_master(program_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.staff_assignments sa
    LEFT JOIN public.role_master r
      ON r.role_id = sa.role_id
    WHERE r.role_id IS NULL
  ) THEN
    RAISE EXCEPTION 'staff_assignments contains invalid role_id values.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_staff_assignments_role'
      AND conrelid = 'public.staff_assignments'::regclass
  ) THEN
    ALTER TABLE public.staff_assignments
      ADD CONSTRAINT fk_staff_assignments_role
      FOREIGN KEY (role_id)
      REFERENCES public.role_master(role_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.event_staff es
    LEFT JOIN public.events e
      ON e.event_id = es.event_id
    WHERE e.event_id IS NULL
  ) THEN
    RAISE EXCEPTION 'event_staff contains invalid event_id values.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.event_staff es
    LEFT JOIN public.role_master r
      ON r.role_id = es.role_id
    WHERE r.role_id IS NULL
  ) THEN
    RAISE EXCEPTION 'event_staff contains invalid role_id values.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_event_staff_event'
      AND conrelid = 'public.event_staff'::regclass
  ) THEN
    ALTER TABLE public.event_staff
      ADD CONSTRAINT fk_event_staff_event
      FOREIGN KEY (event_id)
      REFERENCES public.events(event_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_event_staff_role'
      AND conrelid = 'public.event_staff'::regclass
  ) THEN
    ALTER TABLE public.event_staff
      ADD CONSTRAINT fk_event_staff_role
      FOREIGN KEY (role_id)
      REFERENCES public.role_master(role_id);
  END IF;
END $$;
