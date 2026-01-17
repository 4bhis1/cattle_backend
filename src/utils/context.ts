import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';

const context = new AsyncLocalStorage<Map<string, any>>();

export const contextMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const store = new Map<string, any>();
    context.run(store, () => {
        next();
    });
};

export const getContext = () => {
    return context.getStore();
};

export const setContextValue = (key: string, value: any) => {
    const store = context.getStore();
    if (store) {
        store.set(key, value);
    }
};

export const getContextValue = (key: string) => {
    const store = context.getStore();
    if (store) {
        return store.get(key);
    }
    return undefined;
};
