import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import connectionRoutes from './routes/connection.routes';
import collectionRoutes from './routes/collection.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cors({ origin: config.clientUrl }));
app.use(express.json());

app.use('/api/connection', connectionRoutes);
app.use('/api/collections', collectionRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
