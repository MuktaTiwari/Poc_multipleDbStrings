import { getConnection } from './mongoConnection.service';
import { ObjectId } from 'mongodb';

export const getDocuments = async (collectionName: string, page: number = 1, limit: number = 25, search?: string) => {
  const { db } = getConnection();
  const collection = db.collection(collectionName);
  
  const skip = (page - 1) * limit;
  
  let query = {};
  if (search) {
    // For POC, simple regex search across string fields isn't easy natively without knowing fields.
    // Wait, let's just search by a common text field if exists or we need to know the schema.
    // Or we can just use $text if there's an index, but there isn't.
    // A quick hack for POC: if search is provided, we can fetch the schema and search all string fields.
    // But since it's a POC, I'll assume we can use $regex on a specific field or use a generic $or on common fields?
    // The prompt says: "For the POC, search string fields using a safe `$or` query. Do not allow arbitrary MongoDB operators from the browser."
    
    // We can fetch one document to guess string fields, or we can just ignore for now if not strictly possible, 
    // Wait, schema is dynamic. Let's fetch schema first to find string fields.
    const { inferCollectionSchema } = require('../utils/typeInference');
    const sampleDocs = await collection.find({}).limit(100).toArray();
    const schema = inferCollectionSchema(sampleDocs);
    const stringFields = schema.filter((f: any) => f.type === 'string').map((f: any) => f.name);
    
    if (stringFields.length > 0) {
      query = {
        $or: stringFields.map((field: string) => ({
          [field]: { $regex: search, $options: 'i' }
        }))
      };
    }
  }

  const [documents, total] = await Promise.all([
    collection.find(query).skip(skip).limit(limit).toArray(),
    collection.countDocuments(query)
  ]);

  return {
    documents,
    total,
    page,
    limit
  };
};

export const createDocument = async (collectionName: string, document: any) => {
  const { db } = getConnection();
  
  // Clean up _id if present so MongoDB generates a new one
  if (document._id) {
    delete document._id;
  }

  const result = await db.collection(collectionName).insertOne(document);
  return result;
};

export const updateDocument = async (collectionName: string, id: string, updates: any) => {
  const { db } = getConnection();
  
  const _id = new ObjectId(id);
  
  // Clean up _id from updates to avoid error
  if (updates._id) {
    delete updates._id;
  }

  const result = await db.collection(collectionName).updateOne(
    { _id },
    { $set: updates }
  );
  
  return result;
};

export const deleteDocument = async (collectionName: string, id: string) => {
  const { db } = getConnection();
  const _id = new ObjectId(id);
  
  const result = await db.collection(collectionName).deleteOne({ _id });
  return result;
};
