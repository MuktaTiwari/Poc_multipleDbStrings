import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

export const connectionService = {
  testConnection: (mongoUri: string, database: string) => 
    api.post('/connection/test', { mongoUri, database }),
  connect: (mongoUri: string, database: string, alias: string) => 
    api.post('/connection/connect', { mongoUri, database, alias }),
  getStatus: () => api.get('/connection/status'),
  listConnections: () => api.get('/connection/list'),
  switchConnection: (id: string) => api.post('/connection/switch', { id }),
};

export const collectionService = {
  list: () => api.get('/collections'),
  getSchema: (collection: string) => api.get(`/collections/${collection}/schema`),
};

export const documentService = {
  list: (collection: string, page: number = 1, limit: number = 25, search?: string) => 
    api.get(`/collections/${collection}/documents`, { params: { page, limit, search } }),
  create: (collection: string, document: any) => 
    api.post(`/collections/${collection}/documents`, document),
  update: (collection: string, id: string, updates: any) => 
    api.patch(`/collections/${collection}/documents/${id}`, updates),
  delete: (collection: string, id: string) => 
    api.delete(`/collections/${collection}/documents/${id}`),
};
