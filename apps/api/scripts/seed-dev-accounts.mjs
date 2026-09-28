import { betterAuth } from 'better-auth';
import { hashPassword } from 'better-auth/crypto';
import pg from 'pg';

const { Pool } = pg;
const resetPasswords = process.argv.includes('--reset-passwords');
const workspaceId = '11111111-1111-4111-8111-111111111111';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const databaseUrl = required('DATABASE_URL');
const secret = required('BETTER_AUTH_SECRET');
const baseURL = required('BETTER_AUTH_URL');
const editorEmail = required('DEV_EDITOR_EMAIL');
const editorPassword = required('DEV_EDITOR_PASSWORD');
const viewerEmail = required('DEV_VIEWER_EMAIL');
const viewerPassword = required('DEV_VIEWER_PASSWORD');

const database = new URL(databaseUrl);

if (
  !['localhost', '127.0.0.1'].includes(database.hostname) ||
  database.pathname !== '/signaldesk'
) {
  throw new Error('This script runs only against the local signaldesk database');
}

if (editorEmail === viewerEmail) {
  throw new Error('Editor and viewer emails must differ');
}

const pool = new Pool({ connectionString: databaseUrl });

const auth = betterAuth({
  database: pool,
  secret,
  baseURL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
});

async function setUpUser(email, password, name, role) {
  const existing = await pool.query(
    'SELECT "id" FROM "user" WHERE "email" = $1',
    [email],
  );

  if (existing.rowCount === 0) {
    await auth.api.signUpEmail({
      body: { email, password, name },
    });
  } else {
    try {
      await auth.api.signInEmail({
        body: { email, password },
      });
    } catch (error) {
      if (error?.body?.code !== 'INVALID_EMAIL_OR_PASSWORD') throw error;

      if (!resetPasswords) {
        throw new Error(
          `${email} has a different stored password. ` +
            'Rerun with --reset-passwords to update local development credentials.',
        );
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const hashedPassword = await hashPassword(password);
        const updated = await client.query(
          `UPDATE "account"
           SET "password" = $1, "updatedAt" = CURRENT_TIMESTAMP
           WHERE "userId" = $2 AND "providerId" = 'credential'
           RETURNING "id"`,
          [hashedPassword, existing.rows[0].id],
        );

        if (updated.rowCount !== 1) {
          throw new Error(`Expected one credential account for ${email}`);
        }

        await client.query(
          'DELETE FROM "session" WHERE "userId" = $1',
          [existing.rows[0].id],
        );

        await client.query('COMMIT');
      } catch (resetError) {
        await client.query('ROLLBACK');
        throw resetError;
      } finally {
        client.release();
      }

      await auth.api.signInEmail({
        body: { email, password },
      });
    }
  }

  const result = await pool.query(
    'SELECT "id" FROM "user" WHERE "email" = $1',
    [email],
  );
  const userId = result.rows[0]?.id;
  if (!userId) throw new Error(`User was not created: ${email}`);

  await pool.query(
    `INSERT INTO workspace_memberships (workspace_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (workspace_id, user_id)
     DO UPDATE SET role = EXCLUDED.role`,
    [workspaceId, userId, role],
  );

  console.log(`${email}: ${role}`);
}

try {
  await setUpUser(editorEmail, editorPassword, 'Development Editor', 'editor');
  await setUpUser(viewerEmail, viewerPassword, 'Development Viewer', 'viewer');
} finally {
  await pool.end();
}