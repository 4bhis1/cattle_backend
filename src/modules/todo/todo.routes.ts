import { Router } from 'express';
import { TodoController } from './todo.controller';
import { protect } from '../../middleware/auth.middleware';
import { catchAsync } from '../../utils/catchAsync';

const router = Router();
const todoController = new TodoController();

router.use(protect()); // Protect all routes

router
    .route('/')
    .get(catchAsync(todoController.getTodos.bind(todoController)))
    .post(catchAsync(todoController.createTodo.bind(todoController)));

router
    .route('/:id')
    .patch(catchAsync(todoController.updateTodo.bind(todoController)))
    .delete(catchAsync(todoController.deleteTodo.bind(todoController)));

export default router;
