import { getConnection } from './mongoConnection.service';
import { inferCollectionSchema, FieldDefinition } from '../utils/typeInference';

export const discoverSchema = async (collectionName: string): Promise<FieldDefinition[]> => {
  const { db } = getConnection();
  
  // Sample up to 100 documents
  const documents = await db.collection(collectionName)
    .find({})
    .limit(100)
    .toArray();

  return inferCollectionSchema(documents);
};
