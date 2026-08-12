import { Router } from 'express';
import * as DocumentController from '../controllers/document.controller';

const router = Router({ mergeParams: true });

router.get('/', DocumentController.listDocuments);
router.post('/', DocumentController.createDocument);
router.patch('/:id', DocumentController.updateDocument);
router.delete('/:id', DocumentController.deleteDocument);

export default router;
