import express from 'express';
import publicRoutes from './publicRoutes';
import privateRoutes from './privateRoutes';
import { protect } from '../middleware/auth.middleware';
import uploadRoutes from './upload.routes';
import todoRoutes from '../modules/todo/todo.routes';
import cattleRoutes from './cattle.routes';
import milkRoutes from './milk.routes';
import feedRoutes from './feed.routes';
import feedStockRoutes from './feedStock.routes';
import medicineRoutes from './medicine.routes';
import medicineAppRoutes from './medicineApplication.routes';
import financeRoutes from './finance.routes';
import otherRoutes from './other.routes';

const router = express.Router();

import features from '../config/features';

router.use('/public', publicRoutes);

if (features.auth.enabled) {
    router.use('/private', protect(), privateRoutes); // Apply auth globally to private routes
} else {
    router.use('/private', privateRoutes); // No auth
}
router.use('/upload', uploadRoutes);
router.use('/todos', todoRoutes);

// App Routes
router.use('/cattle', cattleRoutes);
router.use('/milk', milkRoutes);
router.use('/feeds', feedRoutes);
router.use('/feed-stocks', feedStockRoutes);
router.use('/medicines', medicineRoutes);
router.use('/medicine-applications', medicineAppRoutes);
router.use('/finance', financeRoutes); // handles /expenses
import salesRoutes from './sales.routes';
router.use('/sales', salesRoutes);
import customerRoutes from './customer.routes';
router.use('/customers', customerRoutes);
import sellerRoutes from './seller.routes';
router.use('/sellers', sellerRoutes);
router.use('/', otherRoutes); // handles /waste, /daily-reports

// Health check inside API
router.get('/health', (req, res) => {
    res.send('API is running');
});

import { handlerMiddleware, errorHandlerMiddleware } from '../middleware/handler.middleware';

// Function to recursively patch router stack
const patchRouter = (routerToPatch: any) => {
  if (routerToPatch.stack) {
    routerToPatch.stack.forEach((layer: any) => {
      if (layer.route) {
        // It's a route, iterate its handlers
        layer.route.stack.forEach((routeLayer: any) => {
          // Wrap the handler
          routeLayer.handle = handlerMiddleware(routeLayer.handle);
        });
      } else if (layer.name === 'router' && layer.handle.stack) {
        // It's a sub-router, recurse
        patchRouter(layer.handle);
      }
    });
  }
};

// Patch all routes mounted on this router
patchRouter(router);

router.use(errorHandlerMiddleware);

export default router;
