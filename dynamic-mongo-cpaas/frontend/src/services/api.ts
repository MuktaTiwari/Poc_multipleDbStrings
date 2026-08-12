import axios, { type InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Access token lives only in memory (never localStorage) to limit XSS exposure.
// The refresh token lives in an httpOnly cookie the browser manages on its own.
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

let onAuthFailure: (() => void) | null = null;
export const setOnAuthFailure = (callback: () => void) => {
  onAuthFailure = callback;
};

const api = axios.create({ baseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

let pendingRefresh: Promise<string | null> | null = null;

const refreshAccessToken = (): Promise<string | null> => {
  pendingRefresh ??= axios
    .post<{ accessToken: string }>(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
    .then((res) => {
      setAccessToken(res.data.accessToken);
      return res.data.accessToken;
    })
    .catch(() => {
      setAccessToken(null);
      return null;
    })
    .finally(() => {
      pendingRefresh = null;
    });
  return pendingRefresh;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableConfig | undefined;
    const isAuthRoute = config?.url?.includes('/auth/');

    if (error.response?.status === 401 && config && !config._retried && !isAuthRoute) {
      config._retried = true;
      const token = await refreshAccessToken();
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
        return api(config);
      }
      onAuthFailure?.();
    }

    throw error;
  },
);

export const authService = {
  register: (email: string, password: string) => api.post('/auth/register', { email, password }),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  refresh: () => axios.post<{ accessToken: string }>(`${baseURL}/auth/refresh`, {}, { withCredentials: true }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const connectionService = {
  testConnection: (mongoUri: string, database: string) => api.post('/connection/test', { mongoUri, database }),
  connect: (mongoUri: string, database: string, alias: string) =>
    api.post('/connection/connect', { mongoUri, database, alias }),
  getStatus: () => api.get('/connection/status'),
  listConnections: () => api.get('/connection/list'),
  switchConnection: (id: string) => api.post('/connection/switch', { id }),
};

export const collectionService = {
  list: () => api.get('/collections'),
  getSchema: (collection: string) => api.get(`/collections/${collection}/schema`),
  create: (name: string) => api.post('/collections', { name }),
};

export const documentService = {
  list: (collection: string, page: number = 1, limit: number = 25, search?: string) =>
    api.get(`/collections/${collection}/documents`, { params: { page, limit, search } }),
  create: (collection: string, document: any) => api.post(`/collections/${collection}/documents`, document),
  update: (collection: string, id: string, updates: any) =>
    api.patch(`/collections/${collection}/documents/${id}`, updates),
  delete: (collection: string, id: string) => api.delete(`/collections/${collection}/documents/${id}`),
};
