import { Request, Response, NextFunction } from 'express';
import { getConnection } from '../services/mongoConnection.service';
import { discoverSchema } from '../services/schemaDiscovery.service';

/**
 * Lists all non-system collections available in the currently connected database.
 * Flow: UI (Sidebar) -> GET /api/collections -> db.listCollections() -> UI
 */
export const listCollections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { db } = getConnection();
    const collectionsRaw = await db.listCollections().toArray();
    const collections = collectionsRaw
      .filter(c => !c.name.startsWith('system.'))
      .map(c => ({ name: c.name }));

    res.json({
      success: true,
      collections
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Creates a new collection in the currently connected database.
 */
export const createCollection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: { message: 'Collection name is required' } });
    }
    const { db } = getConnection();
    await db.createCollection(name);
    res.json({ success: true, message: `Collection ${name} created successfully` });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Dynamically analyzes the structure of a specific collection and returns its inferred schema.
 * It does this by sampling existing documents in the collection using schemaDiscovery.service.
 * Flow: UI (Collection Page loads) -> GET /api/collections/:collection/schema -> discoverSchema() -> Generates Form/Table UI
 */
export const getCollectionSchema = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = req.params.collection as string;
    const fields = await discoverSchema(collection);

    res.json({
      collection,
      fields
    });
  } catch (error: any) {
    next(error);
  }
};
