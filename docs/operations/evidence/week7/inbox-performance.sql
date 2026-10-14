\set ON_ERROR_STOP on
\pset pager off

DO $$
BEGIN
  IF current_database() <> 'signaldesk_test' THEN
    RAISE EXCEPTION 'Performance investigation requires signaldesk_test';
  END IF;
END
$$;

SELECT version();
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'feedback'
ORDER BY indexname;

BEGIN;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '5s';

-- Temporarily remove the shipped index for the baseline.
-- ROLLBACK restores it, including if the connection closes on failure.
DROP INDEX idx_feedback_workspace_created_id;

CREATE TEMP TABLE perf_workspace AS
SELECT uuid_generate_v4() AS id;

INSERT INTO workspaces (id, name)
SELECT id, 'Synthetic Week 7 performance investigation'
FROM perf_workspace;

INSERT INTO feedback (workspace_id, content, created_at, occurred_at)
SELECT
  w.id,
  'Synthetic feedback ' || n || ': ' ||
    repeat('The monthly report export needs fewer steps. ', 8),
  timestamptz '2026-10-01 00:00:00+00' + n * interval '1 second',
  timestamptz '2026-10-01 00:00:00+00' + n * interval '1 second'
FROM perf_workspace w
CROSS JOIN generate_series(1, 10000) AS n;

ANALYZE feedback;

SELECT count(*) AS synthetic_rows,
       min(length(content)) AS min_content_characters,
       max(length(content)) AS max_content_characters
FROM feedback
WHERE workspace_id = (SELECT id FROM perf_workspace);

CREATE TEMP TABLE perf_query AS
SELECT format(
  'EXPLAIN (ANALYZE, BUFFERS)
   SELECT f.id, f.workspace_id AS "workspaceId",
          f.source, f.content, f.version,
          f.occurred_at AS "occurredAt",
          f.created_at AS "createdAt",
          to_char(f.created_at AT TIME ZONE ''UTC'',
                  ''YYYY-MM-DD"T"HH24:MI:SS.US"Z"'') AS "cursorCreatedAt"
   FROM feedback f
   WHERE f.workspace_id = %L::uuid
   ORDER BY f.created_at DESC, f.id DESC
   LIMIT 21;',
  w.id
) AS sql
FROM perf_workspace w;

\echo BEFORE INDEX: first run is warm-up
SELECT q.sql
FROM perf_query q
CROSS JOIN generate_series(1, 6) AS run(n)
ORDER BY run.n
\gexec

CREATE INDEX idx_feedback_workspace_created_id
ON feedback (workspace_id, created_at DESC, id DESC);

ANALYZE feedback;

\echo AFTER INDEX: first run is warm-up
SELECT q.sql
FROM perf_query q
CROSS JOIN generate_series(1, 6) AS run(n)
ORDER BY run.n
\gexec

ROLLBACK;

SELECT indexname, indexdef
FROM pg_indexes
WHERE indexname = 'idx_feedback_workspace_created_id';