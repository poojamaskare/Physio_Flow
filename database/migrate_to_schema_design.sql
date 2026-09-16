-- Migrates the live schema to match schema_design.md's consolidated 2-role design.
-- Run this once in the Supabase SQL editor. Order matters (drops depend on nothing
-- else referencing them, verified against live data + full app code grep beforehand).

-- 1. Unify `sessions` to the shape the app already queries everywhere
--    (accuracy, duration, started_at, exercise_id), alongside the legacy
--    video_id/reps_completed/accuracy_avg/completed_at columns (left untouched).
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS exercise_id UUID REFERENCES public.exercises(id),
  ADD COLUMN IF NOT EXISTS accuracy INTEGER,
  ADD COLUMN IF NOT EXISTS duration INTEGER,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT NOW();

-- 2. Drop the admin role: remove admin-role users, then restrict the CHECK
--    constraint to doctor/patient only.
DELETE FROM public.users WHERE role = 'admin';

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role = ANY (ARRAY['doctor'::text, 'patient'::text]));

-- 3. Drop `assignments` — every row is already duplicated in users.doctor_id,
--    verified by comparing all 7 live rows before this migration was written.
DROP TABLE IF EXISTS public.assignments;

-- 4. Drop `exercise_videos` — 0 rows, zero references anywhere in the app code.
DROP TABLE IF EXISTS public.exercise_videos;
