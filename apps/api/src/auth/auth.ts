import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!databaseUrl || !secret || !baseURL) {
  throw new Error(
    'DATABASE_URL, BETTER_AUTH_SECRET, and BETTER_AUTH_URL are required',
  );
}

export const auth = betterAuth({
  database: new Pool({ connectionString: databaseUrl }),
  secret,
  baseURL,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
});