import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import connectionRoutes from './routes/connection.routes';
import collectionRoutes from './routes/collection.routes';
import { errorHandler } from './middleware/error.middleware';
import { requireAuth } from './middleware/auth.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';

const app = express();
app.disable('x-powered-by');

// credentials: true is required so the browser sends/receives the httpOnly refresh
// cookie - this only works with an exact origin, never with origin: '*'.
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Auth routes are intentionally unauthenticated (you can't require a token to get a token).
app.use('/api/auth', authRoutes);

// Everything else that talks to a client's connected MongoDB requires a valid session.
// TODO production: requireAuth only proves "some user is logged in" - it does not yet
// scope which tenant's connections/collections that user may access.
app.use('/api', apiLimiter);
app.use('/api/connection', requireAuth, connectionRoutes);
app.use('/api/collections', requireAuth, collectionRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
