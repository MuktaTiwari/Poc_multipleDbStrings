import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

// Production TODO: replace this single shared "system" database with a
// managed connection (and encrypted credentials/secrets manager) once this
// stops being a single-process POC.
let systemClient: MongoClient | null = null;
let systemDb: Db | null = null;

export const getSystemDb = async (): Promise<Db> => {
  if (systemDb) return systemDb;

  const systemUri = process.env.SYSTEM_DB_URI;
  if (!systemUri) {
    throw new Error('SYSTEM_DB_URI environment variable is not defined.');
  }

  systemClient = new MongoClient(systemUri.trim());
  await systemClient.connect();
  systemDb = systemClient.db();

  // Indexes are created once per process here since there's no migration runner in this POC.
  await systemDb.collection('users').createIndex({ email: 1 }, { unique: true });
  await systemDb.collection('refresh_tokens').createIndex({ userId: 1 });
  await systemDb.collection('refresh_tokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  return systemDb;
};
