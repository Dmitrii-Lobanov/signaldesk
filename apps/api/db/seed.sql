BEGIN;

INSERT INTO workspaces (id, name)
VALUES ('11111111-1111-4111-8111-111111111111', 'Demo workspace')
ON CONFLICT (id) DO NOTHING;

INSERT INTO feedback (id, workspace_id, source, content, occurred_at)
VALUES (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'manual',
  'The export button is difficult to find.',
  '2026-09-01T12:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

COMMIT;