import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../utils/jwtToken';
import features from '../config/features';
import { AppError } from '../utils/AppError';

// Extend Request interface to include user
declare global {
    namespace Express {
        interface User {
            id?: string;
            role?: string;
            [key: string]: any;
        }
        interface Request {
            user?: User;
            user_id?: string;
        }
    }
}

export const protect = (optional: boolean = false) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // 1) Check if auth is enabled globally
        if (!features.auth.enabled) {
            if (!optional) {
                // If auth disabled but route requires it? 
                // Actually if auth disabled globally, we treat everything as public or mock user?
                // Let's assume if disabled, we proceed without user.
            }
            return next();
        }

        // 2) Get token and check of it's there
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.headers.authorization) {
            token = req.headers.authorization;
        }

        if (!token) {
            if (optional) return next();
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }

        // 3) Verification token
        try {
            const decoded: any = authenticateToken(token);
            req.user_id = decoded; // Ensure authenticateToken returns what we expect
            req.user = { id: decoded }; // Mock user object for now, usually we fetch user from DB here
            next();
        } catch (err) {
            if (optional) return next();
            return next(new AppError('Invalid token. Please log in again!', 401));
        }
    };
};

// Restrict to certain roles
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!features.auth.enabled) return next();

        // Check if req.user.role is in roles
        // We need to fetch full user in protect middleware for this to work
        // For now, placeholder
        if (!req.user || !roles.includes(req.user.role as string)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }

        next();
    };
};
