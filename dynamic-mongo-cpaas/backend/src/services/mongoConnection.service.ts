import { MongoClient, Db } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import * as ConnectionRepository from '../repositories/connection.repository';
import { SavedConnection } from '../models/connection.model';

export interface ActiveConnection {
  client: MongoClient;
  db: Db;
  databaseName: string;
  id?: string;
  alias?: string;
}

// Memory cache for active MongoDB clients
// TODO production: replace this single-process client pool with a tenant-aware
// connection manager (see mongoConnection.service.ts module docs / README).
const clientPool = new Map<string, ActiveConnection>();
let currentActiveId: string | null = null;

const sanitizeUri = (uri: string): string =>
  uri
    .trim()
    .replace(/^["'“”]|["'“”]$/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');

export const getSavedConnections = async (): Promise<SavedConnection[]> => {
  try {
    return await ConnectionRepository.list();
  } catch (e) {
    console.error('Error reading saved connections from System DB', e);
    return [];
  }
};

export const saveConnection = async (alias: string, uri: string, database: string): Promise<SavedConnection> => {
  const cleanUri = sanitizeUri(uri);
  const existing = await ConnectionRepository.findByUriAndDatabase(cleanUri, database);
  if (existing) {
    return existing;
  }

  const newConnection: SavedConnection = { id: uuidv4(), alias, uri: cleanUri, database };
  await ConnectionRepository.insert(newConnection);
  return newConnection;
};

// Internal helper to establish a real connection
const establishConnection = async (
  uri: string,
  databaseName: string,
  id: string,
  alias: string,
): Promise<ActiveConnection> => {
  if (clientPool.has(id)) {
    return clientPool.get(id)!;
  }

  const client = new MongoClient(sanitizeUri(uri));
  await client.connect();
  const db = client.db(databaseName);
  await db.command({ ping: 1 });

  const active: ActiveConnection = { client, db, databaseName, id, alias };
  clientPool.set(id, active);
  return active;
};

// Switch the globally active connection
export const switchConnection = async (id: string): Promise<ActiveConnection> => {
  const connections = await getSavedConnections();
  const saved = connections.find((c) => c.id === id);
  if (!saved) {
    throw new Error('Saved connection not found');
  }

  const active = await establishConnection(saved.uri, saved.database, saved.id, saved.alias);
  currentActiveId = saved.id;
  return active;
};

// Legacy connect support (from raw credentials), also saves it now
export const connect = async (
  uri: string,
  databaseName: string,
  alias: string = 'My Database',
): Promise<ActiveConnection> => {
  const saved = await saveConnection(alias, uri, databaseName);
  return switchConnection(saved.id);
};

export const getConnection = (): ActiveConnection => {
  if (!currentActiveId || !clientPool.has(currentActiveId)) {
    throw new Error('No active database connection');
  }
  return clientPool.get(currentActiveId)!;
};

export const disconnect = async (): Promise<void> => {
  if (currentActiveId && clientPool.has(currentActiveId)) {
    await clientPool.get(currentActiveId)!.client.close();
    clientPool.delete(currentActiveId);
    currentActiveId = null;
  }
};

export const isConnected = (): boolean => {
  return currentActiveId !== null && clientPool.has(currentActiveId);
};
