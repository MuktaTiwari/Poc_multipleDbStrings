import { Router } from 'express';
import * as ConnectionController from '../controllers/connection.controller';

const router = Router();

router.post('/test', ConnectionController.testConnection);
router.post('/connect', ConnectionController.connectDatabase);
router.get('/status', ConnectionController.getConnectionStatus);
router.get('/list', ConnectionController.listConnections);
router.post('/switch', ConnectionController.switchDatabase);
export default router;
