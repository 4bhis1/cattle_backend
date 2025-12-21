import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { upload } from '../services/upload.service';
import { protect } from '../middleware/auth.middleware';
import { catchAsync } from '../utils/catchAsync';

const router = Router();
const uploadController = new UploadController();

router.post(
    '/',
    protect(),
    upload.single('file'),
    catchAsync(uploadController.uploadFile.bind(uploadController))
);

export default router;
