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

if (secret.length < 32 || secret.startsWith('replace-')) {
  throw new Error(
    'BETTER_AUTH_SECRET must be a configured secret of at least 32 characters',
  );
}

export const auth = betterAuth({
  database: new Pool({ connectionString: databaseUrl }),
  secret,
  baseURL,
  advanced: {
    ipAddress: {
      ipAddressHeaders: [],
    },
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    storage: 'memory',
    window: 10,
    max: 100,
    customRules: {
      '/sign-in/email': {
        window: 60,
        max: 5,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
});
