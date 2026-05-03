import { Request, Response, NextFunction } from 'express';
import Milk from '../models/milk.model';
import Cattle from '../models/cattle.model';
import * as factory from './handlerFactory';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export const getMilkAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { startDate, endDate, cattleId, groupBy = 'day', page = 1, limit = 10 } = req.query;

    const matchStage: any = {};

    if (startDate && endDate) {
        matchStage.date = {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string)
        };
    }

    if (cattleId) {
        matchStage.cattleId = cattleId;
    }

    let groupId: any;
    let sort: any = { "dateGroup": -1 };
    let projectGroupId: any = "$_id";
    const pipeline: any[] = [
        { $match: matchStage }
    ];

    if (['cattle', 'breed', 'cattleType'].includes(groupBy as string)) {
        // Join with cattle collection
        pipeline.push(
            {
                $addFields: {
                    cattleObjId: { $toObjectId: "$cattleId" }
                }
            },
            {
                $lookup: {
                    from: "cattles",
                    localField: "cattleObjId",
                    foreignField: "_id",
                    as: "cattleDetails"
                }
            },
            { $unwind: "$cattleDetails" }
        );

        if (groupBy === 'cattle') {
            groupId = { 
                id: "$cattleDetails._id",
                name: "$cattleDetails.name",
                tag: "$cattleDetails.tag" 
            };
            sort = { "totalVolume": -1 }; 
        } else if (groupBy === 'breed') {
            groupId = "$cattleDetails.breed";
            sort = { "totalVolume": -1 };
        } else if (groupBy === 'cattleType') {
            groupId = "$cattleDetails.cattleType";
            sort = { "totalVolume": -1 };
        }
    } else {
        // Date based grouping
        if (groupBy === 'year') {
             groupId = { year: { $year: "$date" } };
        } else if (groupBy === 'week') {
            groupId = { 
                year: { $year: "$date" },
                week: { $week: "$date" }
            };
        } else if (groupBy === 'month') {
            groupId = { 
                year: { $year: "$date" },
                month: { $month: "$date" }
            };
        } else {
            // default day
            groupId = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
        }
    }

    pipeline.push(
        {
            $group: {
                _id: groupId,
                totalVolume: { $sum: "$quantity" },
                avgFat: { $avg: "$fat" },
                
                // Session specific
                morningVolume: { 
                    $sum: { $cond: [{ $eq: ["$session", "morning"] }, "$quantity", 0] } 
                },
                eveningVolume: { 
                    $sum: { $cond: [{ $eq: ["$session", "evening"] }, "$quantity", 0] } 
                },
                morningFat: { 
                    $avg: { $cond: [{ $eq: ["$session", "morning"] }, "$fat", null] } 
                },
                eveningFat: { 
                    $avg: { $cond: [{ $eq: ["$session", "evening"] }, "$fat", null] } 
                },

                count: { $sum: 1 },
                // Collect unique cattle
                cattle: { $addToSet: "$cattleId" }
            }
        },
        {
            $project: {
                _id: 0,
                group: "$_id", 
                dateGroup: "$_id", 
                totalVolume: 1,
                avgFat: { $round: ["$avgFat", 2] },
                
                morningVolume: 1,
                eveningVolume: 1,
                morningFat: { $round: ["$morningFat", 2] },
                eveningFat: { $round: ["$eveningFat", 2] },
                
                count: 1,
                uniqueCattle: { $size: "$cattle" }
            }
        },
        { $sort: sort as any },
        {
            $facet: {
                metadata: [
                    { $count: "total" },
                    { $addFields: { page: Number(page) } }
                ],
                data: [
                    { $skip: (Number(page) - 1) * Number(limit) },
                    { $limit: Number(limit) }
                ]
            }
        }
    );

    const stats = await Milk.aggregate(pipeline);
    
    const results = stats[0].data;
    const total = stats[0].metadata[0]?.total || 0;

    return res.status(200).json({ // Return response directly or ensure catchAsync handles return
        status: 'success',
        results: results.length,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: results
    });
});

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
        // 'status.current': { $nin: ['sold', 'deceased'] },
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

export const getMilkProductionReport = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { startDate, endDate, cattleId, groupBy = 'day', page = 1, limit = 10, breed, cattleType } = req.query;

    const matchStage: any = {};

    if (startDate && endDate) {
        matchStage.date = {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string)
        };
    }

    if (cattleId) {
        matchStage.cattleId = cattleId;
    }

    let groupId: any;
    let sort: any = { "dateGroup": -1 };
    const pipeline: any[] = [
        { $match: matchStage }
    ];

    const shouldJoinCattle = ['cattle', 'breed', 'cattleType'].includes(groupBy as string) || breed || cattleType;

    if (shouldJoinCattle) {
        // Join with cattle collection
        pipeline.push(
            {
                $addFields: {
                    cattleObjId: { $toObjectId: "$cattleId" }
                }
            },
            {
                $lookup: {
                    from: "cattles",
                    localField: "cattleObjId",
                    foreignField: "_id",
                    as: "cattleDetails"
                }
            },
            { $unwind: "$cattleDetails" }
        );

        // Apply filters if present
        if (breed) {
            pipeline.push({ $match: { "cattleDetails.breed": breed } });
        }
        if (cattleType) {
            pipeline.push({ $match: { "cattleDetails.cattleType": cattleType } });
        }

        if (groupBy === 'cattle') {
            groupId = { 
                id: "$cattleDetails._id",
                name: "$cattleDetails.name",
                tag: "$cattleDetails.tag" 
            };
            sort = { "totalVolume": -1 }; 
        } else if (groupBy === 'breed') {
            groupId = "$cattleDetails.breed";
            sort = { "totalVolume": -1 };
        } else if (groupBy === 'cattleType') {
            groupId = "$cattleDetails.cattleType";
            sort = { "totalVolume": -1 };
        }
    }
    
    // If not grouping by cattle attributes, fallback to date or default
    if (!['cattle', 'breed', 'cattleType'].includes(groupBy as string)) {

        if (groupBy === 'year') {
             groupId = { year: { $year: "$date" } };
        } else if (groupBy === 'week') {
            groupId = { 
                year: { $year: "$date" },
                week: { $week: "$date" }
            };
        } else if (groupBy === 'month') {
            groupId = { 
                year: { $year: "$date" },
                month: { $month: "$date" }
            };
        } else {
            // default day
            groupId = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
        }
    }


    pipeline.push(
        {
            $group: {
                _id: groupId,
                totalVolume: { $sum: "$quantity" },
                avgFat: { $avg: "$fat" },
                
                // Session specific - Case Insensitive Check
                morningVolume: { 
                    $sum: { $cond: [{ $eq: [{ $toLower: "$session" }, "morning"] }, "$quantity", 0] } 
                },
                eveningVolume: { 
                    $sum: { $cond: [{ $eq: [{ $toLower: "$session" }, "evening"] }, "$quantity", 0] } 
                },
                morningFat: { 
                    $avg: { $cond: [{ $eq: [{ $toLower: "$session" }, "morning"] }, "$fat", null] } 
                },
                eveningFat: { 
                    $avg: { $cond: [{ $eq: [{ $toLower: "$session" }, "evening"] }, "$fat", null] } 
                },

                count: { $sum: 1 },
                cattle: { $addToSet: "$cattleId" }
            }
        },
        {
            $project: {
                _id: 0,
                group: "$_id", 
                dateGroup: "$_id", 
                totalVolume: 1,
                avgFat: { $round: ["$avgFat", 2] },
                
                morningVolume: 1,
                eveningVolume: 1,
                morningFat: { $round: ["$morningFat", 2] },
                eveningFat: { $round: ["$eveningFat", 2] },
                
                count: 1,
                uniqueCattle: { $size: "$cattle" }
            }
        },
        { $sort: sort as any },
        {
            $facet: {
                metadata: [
                    { $count: "total" },
                    { $addFields: { page: Number(page) } }
                ],
                data: [
                    { $skip: (Number(page) - 1) * Number(limit) },
                    { $limit: Number(limit) }
                ]
            }
        }
    );

    const stats = await Milk.aggregate(pipeline);
    
    const results = stats[0].data;
    const total = stats[0].metadata[0]?.total || 0;

    return res.status(200).json({
        status: 'success',
        results: results.length,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: results
    });
});

export const getMilks = factory.getAll(Milk);
export const getMilk = factory.getOne(Milk);
export const createMilk = factory.createOne(Milk);
export const updateMilk = factory.updateOne(Milk);
export const deleteMilk = factory.deleteOne(Milk);
