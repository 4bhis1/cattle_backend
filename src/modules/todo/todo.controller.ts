import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../controllers/BaseController';
import { Todo } from './todo.model';
import { AppError } from '../../utils/AppError';

export class TodoController extends BaseController {

    createTodo = async (req: Request, res: Response, next: NextFunction) => {
        const { title, description } = req.body;
        const user_id = req.user_id; // Added by auth middleware

        const todo = await Todo.create({ title, description, user_id });

        this.sendResponse(res, 201, 'Todo created successfully', todo);
    };

    getTodos = async (req: Request, res: Response, next: NextFunction) => {
        const user_id = req.user_id;
        const todos = await Todo.find({ user_id });

        this.sendResponse(res, 200, 'Todos fetched successfully', todos);
    };

    updateTodo = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const todo = await Todo.findOneAndUpdate(
            { _id: id, user_id: req.user_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!todo) {
            return next(new AppError('No todo found with that ID', 404));
        }

        this.sendResponse(res, 200, 'Todo updated successfully', todo);
    };

    deleteTodo = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const todo = await Todo.findOneAndDelete({ _id: id, user_id: req.user_id });

        if (!todo) {
            return next(new AppError('No todo found with that ID', 404));
        }

        this.sendResponse(res, 204, 'Todo deleted successfully', null);
    };
}
