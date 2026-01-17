import { Request, Response, NextFunction } from 'express';
import Cattle from '../models/cattle.model';
import File from '../models/file.model';
import * as factory from './handlerFactory';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

import ApiFeatures from '../utils/ApiFeatures';

export const getCattles = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let filter = {};
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search as string, 'i');
        filter = {
            $or: [
                { name: searchRegex },
                { breed: searchRegex },
                { 'status.current': searchRegex }
            ]
        };
    }

    const features = new ApiFeatures(Cattle.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const doc = await features.query;

    return {
        results: doc.length,
        data: doc
    };

});
export const getCattle = factory.getOne(Cattle, { path: 'images' });

export const createCattle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Cattle.create(req.body);

    // Commit files
    if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
        await File.updateMany(
            { _id: { $in: req.body.images } },
            { status: 'active' }
        );
    }

    return {
        statusCode: 201,
        data: doc
    };
});

export const updateCattle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Cattle.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }

    // Commit files
    if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
        await File.updateMany(
            { _id: { $in: req.body.images } },
            { status: 'active' }
        );
    }

    return {
        data: doc
    };
});

export const deleteCattle = factory.deleteOne(Cattle);
