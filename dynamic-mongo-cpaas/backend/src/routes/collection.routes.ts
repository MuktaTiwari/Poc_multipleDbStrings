import { Router } from 'express';
import * as CollectionController from '../controllers/collection.controller';
import documentRoutes from './document.routes';

const router = Router();

router.get('/', CollectionController.listCollections);
router.get('/:collection/schema', CollectionController.getCollectionSchema);

// Nest document routes under collections
router.use('/:collection/documents', documentRoutes);

export default router;
