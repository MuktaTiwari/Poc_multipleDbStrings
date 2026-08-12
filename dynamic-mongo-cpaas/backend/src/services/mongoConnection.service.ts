import { MongoClient, Db } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

export interface SavedConnection {
  id: string;
  alias: string;
  uri: string;
  database: string;
}

export interface ActiveConnection {
  client: MongoClient;
  db: Db;
  databaseName: string;
  id?: string;
  alias?: string;
}

// Memory cache for active MongoDB clients
const clientPool = new Map<string, ActiveConnection>();
let currentActiveId: string | null = null;

// System DB connection for saving connections
let systemClient: MongoClient | null = null;
let systemDb: Db | null = null;

const getSystemDb = async (): Promise<Db> => {
  if (systemDb) return systemDb;
  
  const systemUri = process.env.SYSTEM_DB_URI;
  if (!systemUri) {
    throw new Error('SYSTEM_DB_URI environment variable is not defined.');
  }

  systemClient = new MongoClient(systemUri.trim());
  await systemClient.connect();
  
  // Try to parse DB name from URI or fallback to a default
  // Just relying on driver's default behavior, or explicitly forcing "system"
  systemDb = systemClient.db(); 
  return systemDb;
};

export const getSavedConnections = async (): Promise<SavedConnection[]> => {
  try {
    const db = await getSystemDb();
    const connections = await db.collection('connections').find().toArray();
    return connections.map(c => ({
      id: c.id,
      alias: c.alias,
      uri: c.uri,
      database: c.database
    }));
  } catch (e) {
    console.error("Error reading saved connections from System DB", e);
    return [];
  }
};

export const saveConnection = async (alias: string, uri: string, database: string): Promise<SavedConnection> => {
  const cleanUri = uri.trim().replace(/^["'“”]|["'“”]$/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const db = await getSystemDb();
  const existing = await db.collection('connections').findOne({ uri: cleanUri, database });
  
  if (existing) {
    return {
      id: existing.id,
      alias: existing.alias,
      uri: existing.uri,
      database: existing.database
    };
  }

  const newConn: SavedConnection = {
    id: uuidv4(),
    alias,
    uri: cleanUri,
    database
  };

  await db.collection('connections').insertOne(newConn);
  return newConn;
};

// Internal helper to establish a real connection
const establishConnection = async (uri: string, databaseName: string, id: string, alias: string): Promise<ActiveConnection> => {
  if (clientPool.has(id)) {
    return clientPool.get(id)!;
  }

  const cleanUri = uri.trim().replace(/^["'“”]|["'“”]$/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const client = new MongoClient(cleanUri);
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
  const saved = connections.find(c => c.id === id);
  if (!saved) {
    throw new Error('Saved connection not found');
  }

  const active = await establishConnection(saved.uri, saved.database, saved.id, saved.alias);
  currentActiveId = saved.id;
  return active;
};

// Legacy connect support (from raw credentials), also saves it now
export const connect = async (uri: string, databaseName: string, alias: string = 'My Database'): Promise<ActiveConnection> => {
  const saved = await saveConnection(alias, uri, databaseName);
  return await switchConnection(saved.id);
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
