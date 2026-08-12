import { Request, Response, NextFunction } from 'express';
import * as DocumentService from '../services/document.service';

/**
 * Retrieves a paginated list of documents from a specific dynamic collection.
 * It also supports basic searching if a search query is provided.
 * Flow: UI (Data Table) -> GET /api/documents/:collection -> Fetches documents from DB -> UI
 */
export const listDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = req.params.collection as string;
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 25;
    const search = req.query.search as string;

    const result = await DocumentService.getDocuments(collection, page, limit, search);

    res.json({
      success: true,
      collection,
      page: result.page,
      limit: result.limit,
      total: result.total,
      documents: result.documents
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Creates a brand new document in the specified collection.
 * Since this is schema-less, it accepts any JSON body provided by the dynamic UI form.
 * Flow: UI (Add Form) -> POST /api/documents/:collection -> Inserts into MongoDB -> Returns new ID -> UI
 */
export const createDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = req.params.collection as string;
    const document = req.body;

    const result = await DocumentService.createDocument(collection, document);

    res.json({
      success: true,
      insertedId: result.insertedId
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Updates an existing document in the specified collection by its MongoDB ObjectId.
 * Only the fields provided in the body (updates) will be modified ($set).
 * Flow: UI (Edit Form) -> PUT /api/documents/:collection/:id -> Modifies in DB -> UI
 */
export const updateDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = req.params.collection as string;
    const id = req.params.id as string;
    const updates = req.body;

    const result = await DocumentService.updateDocument(collection, id, updates);

    res.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Deletes a specific document from a collection by its MongoDB ObjectId.
 * Flow: UI (Delete Button) -> DELETE /api/documents/:collection/:id -> Removes from DB -> UI
 */
export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = req.params.collection as string;
    const id = req.params.id as string;

    const result = await DocumentService.deleteDocument(collection, id);

    res.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (error: any) {
    next(error);
  }
};
