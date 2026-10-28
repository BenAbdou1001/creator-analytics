-- Deleting an account cascades to import_batches and (via content_items) to the
-- facts that reference those batches. With immediate NO ACTION FKs the batch
-- check fires before the nested cascade removes the facts, so the delete fails.
-- Checking at commit keeps the protection (a batch with facts still can't be
-- deleted on its own) while letting the account cascade complete.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT conrelid::regclass AS tbl, conname FROM pg_constraint
           WHERE contype = 'f' AND confrelid = 'creator.import_batches'::regclass LOOP
    EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I DEFERRABLE INITIALLY DEFERRED', r.tbl, r.conname);
  END LOOP;
END $$;
