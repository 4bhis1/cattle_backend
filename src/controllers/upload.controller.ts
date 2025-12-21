import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { AppError } from '../utils/AppError';
import logger from '../config/logger';

export class UploadController extends BaseController {
    uploadFile = async (req: Request, res: Response, next: NextFunction) => {
        if (!req.file) {
            return next(new AppError('No file uploaded', 400));
        }

        logger.info(`File uploaded: ${req.file.filename}`);

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        this.sendResponse(res, 200, 'File uploaded successfully', {
            filename: req.file.filename,
            path: req.file.path,
            url: fileUrl,
            mimetype: req.file.mimetype
        });
    };
}
