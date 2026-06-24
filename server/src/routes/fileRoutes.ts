import { Router } from 'express';
import { uploadFile, downloadFile, getFiles } from '../controllers/fileController';
import { authenticateJWT } from '../middleware/auth';
import { upload } from '../middleware/fileUpload';

const router = Router();

router.use(authenticateJWT);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/:id/download', downloadFile);
router.get('/', getFiles);

export default router;
