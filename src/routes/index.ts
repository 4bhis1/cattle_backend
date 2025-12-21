import express from 'express';
import publicRoutes from './publicRoutes';
import privateRoutes from './privateRoutes';
import { protect } from '../middleware/auth.middleware';

import uploadRoutes from './upload.routes';
import todoRoutes from '../modules/todo/todo.routes';

const router = express.Router();

// Mount routes
// You can structure this further like router.use('/users', userRoutes);

router.use('/public', publicRoutes);
router.use('/private', protect(), privateRoutes); // Apply auth globally to private routes
router.use('/upload', uploadRoutes);
router.use('/todos', todoRoutes);

// Health check inside API
router.get('/health', (req, res) => {
    res.send('API is running');
});

export default router;
