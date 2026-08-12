import { getSystemDb } from '../db/systemDb';
import { SavedConnection } from '../models/connection.model';

export const list = async (): Promise<SavedConnection[]> => {
  const db = await getSystemDb();
  const connections = await db.collection('connections').find().toArray();
  return connections.map((c) => ({
    id: c.id,
    alias: c.alias,
    uri: c.uri,
    database: c.database,
  }));
};

export const findByUriAndDatabase = async (uri: string, database: string): Promise<SavedConnection | null> => {
  const db = await getSystemDb();
  const existing = await db.collection('connections').findOne({ uri, database });
  if (!existing) return null;
  return { id: existing.id, alias: existing.alias, uri: existing.uri, database: existing.database };
};

export const insert = async (connection: SavedConnection): Promise<void> => {
  const db = await getSystemDb();
  await db.collection('connections').insertOne(connection);
};
