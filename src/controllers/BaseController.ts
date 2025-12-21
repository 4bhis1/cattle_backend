import { Response } from 'express';

export abstract class BaseController {
    protected sendResponse(
        res: Response,
        statusCode: number,
        message: string,
        data?: any,
        tokens?: any
    ) {
        res.status(statusCode).json({
            status: `${statusCode}`.startsWith('2') ? 'success' : 'fail',
            message,
            data,
            ...tokens,
        });
    }
}
