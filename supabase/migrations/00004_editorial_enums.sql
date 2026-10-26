-- ==============================================================================
-- The Executive Brief by OU DBM
-- Migration 00004: Editorial Enums Extension
-- Description: Extends the editorial_role enum with 'administrator' and 'section_writer',
--              and creates the account_status enum.
-- 
-- PostgreSQL Transaction Safety:
-- In PostgreSQL, ALTER TYPE ... ADD VALUE cannot be executed in the same transaction
-- block that uses the new enum value. This migration is dedicated strictly to enum
-- declarations so they are committed before Migration 00005 references them.
-- ==============================================================================


-- ==============================================================================
-- The Executive Brief by OU DBM
-- Migration 00004: Editorial Enums Extension
--
-- IMPORTANT:
-- 1. Confirm the existing public.editorial_role enum contains the anchor labels.
-- 2. Run and commit this migration separately.
-- 3. Do not run Migration 00005 until this migration succeeds.
-- 4. Do not execute against production until the preflight is approved.
-- ==============================================================================

-- Extend the existing role enum.
ALTER TYPE public.editorial_role
  ADD VALUE IF NOT EXISTS 'administrator' BEFORE 'editor_in_chief';

ALTER TYPE public.editorial_role
  ADD VALUE IF NOT EXISTS 'section_writer' AFTER 'section_editor';

-- Create account_status if absent, or fail if an incompatible type exists.
DO $$
DECLARE
  type_oid oid;
  type_kind "char";
  actual_labels text[];
  expected_labels constant text[] :=
    ARRAY['pending', 'approved', 'rejected', 'suspended'];
BEGIN
  SELECT t.oid, t.typtype
    INTO type_oid, type_kind
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
    AND t.typname = 'account_status';

  IF type_oid IS NULL THEN
    CREATE TYPE public.account_status AS ENUM (
      'pending',
      'approved',
      'rejected',
      'suspended'
    );
  ELSE
    IF type_kind <> 'e' THEN
      RAISE EXCEPTION
        'public.account_status exists but is not an enum. Stop and inspect the existing schema.';
    END IF;

    SELECT array_agg(e.enumlabel::text ORDER BY e.enumsortorder)
      INTO actual_labels
    FROM pg_enum e
    WHERE e.enumtypid = type_oid;

    IF actual_labels IS DISTINCT FROM expected_labels THEN
      RAISE EXCEPTION
        'public.account_status has unexpected labels: %. Expected: %.',
        actual_labels, expected_labels;
    END IF;
  END IF;
END
$$;
