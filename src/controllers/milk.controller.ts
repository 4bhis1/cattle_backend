import { Request, Response, NextFunction } from 'express';
import Milk from '../models/milk.model';
import Cattle from '../models/cattle.model';
import * as factory from './handlerFactory';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export const getDailyMilkRecords = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { date } = req.query;
    if (!date) {
        return next(new AppError('Date is required', 400));
    }

    // Parse date for range (start of day to end of day)
    const startOfDay = new Date(date as string);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // 1. Get all relevant cattle (active, pregnant, etc.) acquired on or before this date
    const cattle = await Cattle.find({
        'status.current': { $nin: ['sold', 'deceased'] },
        dateOfAcquisition: { $lt: endOfDay }
    }).select('name breed status.current images expectedMilkProduction fatPercentage');

    // 2. Get milk records for the date
    const milkRecords = await Milk.find({
        date: {
            $gte: startOfDay,
            $lt: endOfDay
        }
    });

    // 3. Merge
    const data = cattle.map((cow) => {
        const cowRecords = milkRecords.filter((m) => m.cattleId === cow._id.toString());
        const morning = cowRecords.find((m) => m.session === 'morning');
        const evening = cowRecords.find((m) => m.session === 'evening');

        // Resolve Image
        let image = '';
        if (cow.images && cow.images.length > 0) {
            image = cow.images[0] as unknown as string;
        }

        return {
            cattleId: cow._id,
            name: cow.name,
            breed: cow.breed,
            status: cow.status.current,
            image: image,
            expectedMilk: cow.expectedMilkProduction || 0,
            morningMilk: morning ? morning.quantity : 0,
            morningFat: morning?.fat || cow.fatPercentage || 0,
            eveningMilk: evening ? evening.quantity : 0,
            eveningFat: evening?.fat || cow.fatPercentage || 0,
            morningId: morning?._id,
            eveningId: evening?._id
        };
    });

    return {
        results: data.length,
        data: data
    };
});

export const bulkUpsertMilk = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const records = req.body;

    if (!Array.isArray(records) || records.length === 0) {
        return { data: [] };
    }

    const operations = records.map((record) => {
        // Ensure date is treated effectively as specific start of day if string provided
        // Mongoose casts strings, but consistent formatting helps avoid duplicates if mixed formats used
        const localDate = new Date(record.date); // e.g. "2024-01-01" -> UTC midnight
        
        return {
            updateOne: {
                filter: {
                    cattleId: record.cattleId,
                    date: localDate, 
                    session: record.session
                },
                update: { 
                    $set: {
                        ...record,
                        date: localDate
                    } 
                },
                upsert: true
            }
        };
    });

    const result = await Milk.bulkWrite(operations);

    return {
        data: result
    };
});

export const getMilks = factory.getAll(Milk);
export const getMilk = factory.getOne(Milk);
export const createMilk = factory.createOne(Milk);
export const updateMilk = factory.updateOne(Milk);
export const deleteMilk = factory.deleteOne(Milk);
