import { ObjectId } from 'mongodb';

export interface FieldDefinition {
  name: string;
  type: string;
  children?: FieldDefinition[];
}

const inferType = (value: any): string => {
  if (value === null) return 'null';
  if (value instanceof ObjectId) return 'ObjectId';
  if (value instanceof Date) return 'date';
  
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  
  return typeof value; // 'string', 'number', 'boolean'
};

const mergeFields = (existingFields: FieldDefinition[], newFields: FieldDefinition[]): FieldDefinition[] => {
  const mergedMap = new Map<string, FieldDefinition>();

  existingFields.forEach(f => mergedMap.set(f.name, f));

  newFields.forEach(newF => {
    const existingF = mergedMap.get(newF.name);
    if (!existingF) {
      mergedMap.set(newF.name, newF);
    } else {
      // If both are objects, merge children
      if (existingF.type === 'object' && newF.type === 'object') {
        existingF.children = mergeFields(existingF.children || [], newF.children || []);
      }
      // If type conflicts, maybe handle it or just keep the first one. We keep existing type for simplicity in POC.
    }
  });

  return Array.from(mergedMap.values());
};

export const inferDocumentSchema = (doc: any): FieldDefinition[] => {
  if (!doc || typeof doc !== 'object') return [];

  return Object.keys(doc).map(key => {
    const value = doc[key];
    const type = inferType(value);
    
    const fieldDef: FieldDefinition = {
      name: key,
      type
    };

    if (type === 'object' && value !== null) {
      fieldDef.children = inferDocumentSchema(value);
    }

    return fieldDef;
  });
};

export const inferCollectionSchema = (documents: any[]): FieldDefinition[] => {
  let schema: FieldDefinition[] = [];

  documents.forEach(doc => {
    const docSchema = inferDocumentSchema(doc);
    schema = mergeFields(schema, docSchema);
  });

  return schema;
};
