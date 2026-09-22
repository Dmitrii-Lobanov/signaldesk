import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Feedback } from './feedback/feedback.entity.js';
import { Workspace } from './workspaces/workspace.entity.js';
import { fileURLToPath } from 'node:url';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run migrations');
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [Workspace, Feedback],
  synchronize: false,
  migrations: [fileURLToPath(new URL('./migrations/*.js', import.meta.url))],
});