import { Request, Response, NextFunction } from 'express';
import { connect, isConnected, getConnection, getSavedConnections, switchConnection } from '../services/mongoConnection.service';
import { MongoClient } from 'mongodb';

/**
 * Tests a MongoDB connection without keeping it active in the service.
 * Used by the UI when the user clicks "Test Connection" to verify credentials and network access.
 * Flow: UI -> POST /api/connection/test -> Creates temporary MongoClient -> Pings DB -> Closes Client -> UI
 */
export const testConnection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mongoUri, database } = req.body;
    
    if (!mongoUri || !database) {
      return res.status(400).json({ success: false, error: { message: 'mongoUri and database are required' } });
    }

    const cleanUri = mongoUri.trim().replace(/^["'“”]|["'“”]$/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
    const client = new MongoClient(cleanUri);
    await client.connect();
    
    const db = client.db(database);
    await db.command({ ping: 1 });
    
    const collectionsRaw = await db.listCollections().toArray();
    const collections = collectionsRaw.map(c => c.name).filter(name => !name.startsWith('system.'));

    await client.close();

    res.json({
      success: true,
      database,
      collections
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'MONGO_CONNECTION_FAILED',
        message: 'Unable to connect to MongoDB',
        details: error.message
      }
    });
  }
};

/**
 * Connects to MongoDB and persists the connection state in the application's memory (mongoConnection.service).
 * Used by the UI when the user clicks "Connect". This allows subsequent API calls to use this active connection.
 * Flow: UI -> POST /api/connection/connect -> mongoConnection.service handles connection -> UI
 */
export const connectDatabase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mongoUri, database, alias } = req.body;
    
    if (!mongoUri || !database) {
      return res.status(400).json({ success: false, error: { message: 'mongoUri and database are required' } });
    }

    const cleanUri = mongoUri.trim().replace(/^["'“”]|["'“”]$/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
    const connectionName = alias || database;
    await connect(cleanUri, database, connectionName);
    
    res.json({ success: true, message: 'Connected successfully' });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'MONGO_CONNECTION_FAILED',
        message: 'Unable to connect to MongoDB',
        details: error.message
      }
    });
  }
};

/**
 * Checks if the backend currently holds an active MongoDB connection.
 * Used by the UI on initial load to determine if it should show the "Connect" prompt or the collections list.
 * Flow: UI loads -> GET /api/connection/status -> Returns true/false based on memory state -> UI
 */
export const getConnectionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isConnected()) {
      const active = getConnection();
      res.json({ success: true, connected: true, database: active.databaseName, alias: active.alias, id: active.id });
    } else {
      res.json({ success: true, connected: false });
    }
  } catch (error: any) {
    next(error);
  }
};

/**
 * Returns all saved connections from the persistent JSON file.
 * Flow: UI -> GET /api/connection/list -> read connections.json -> UI
 */
export const listConnections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const connections = await getSavedConnections();
    res.json({ success: true, connections });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Switches the active database connection to an already saved connection ID.
 * Flow: UI (Dropdown) -> POST /api/connection/switch -> updates mongoConnection.service active state -> UI
 */
export const switchDatabase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: { message: 'Connection ID is required' } });
    }

    await switchConnection(id);
    res.json({ success: true, message: 'Switched connection successfully' });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SWITCH_FAILED',
        message: 'Unable to switch connection',
        details: error.message
      }
    });
  }
};
