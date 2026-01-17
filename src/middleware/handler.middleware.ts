import { NextFunction, Request, Response } from 'express';

export const handlerMiddleware = (
  callbackFunction: (req: Request, res: Response, next: NextFunction) => any
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let nextCalled = false;
    const wrappedNext: NextFunction = (err?: any) => {
      nextCalled = true;
      next(err);
    };

    try {
      const apiData: any = await callbackFunction(req, res, wrappedNext);

      if (nextCalled) {
        return;
      }

      if (res.headersSent) {
        return;
      }

      if (apiData && typeof apiData === 'object') {
        const { data, statusCode, message, ...rest } = apiData;

        res.status(statusCode || 200).json({
          status: 'success',
          message: message || 'Success',
          ...rest,
          data,
        });
      } else {
        res.status(200).json({
          status: 'success',
          message: 'Success',
          data: apiData,
        });
      }
    } catch (error) {
      if (!nextCalled) {
        next(error);
      }
    }
  };
};

export const errorHandlerMiddleware = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { message, statusCode, ...rest } = error;
  res.status(statusCode || 500).json({
    message: message || 'Internal Server Error',
    ...rest,
  });
};
