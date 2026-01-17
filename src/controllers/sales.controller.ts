import { Request, Response, NextFunction } from 'express';
import { Sales } from '../models/finance.model';
import Customer from '../models/customer.model';
import Milk from '../models/milk.model';

import * as factory from './handlerFactory';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

// Basic CRUD
export const getAllSales = factory.getAll(Sales);
export const getSale = factory.getOne(Sales);
export const createSale = factory.createOne(Sales);
export const updateSale = factory.updateOne(Sales);
export const deleteSale = factory.deleteOne(Sales);

// Daily Sales Grid Data
export const getDailySales = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { date } = req.query;
    if (!date) {
        return next(new AppError('Date is required', 400));
    }

    // Parse date for range (start of day to end of day)
    const startOfDay = new Date(date as string);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // 1. Get all active customers created on or before this date
    const customers = await Customer.find({ 
        isActive: true,
        createdAt: { $lt: endOfDay }
    }).sort('name');

    // 2. Get sales records for the date
    const salesRecords = await Sales.find({
        date: {
            $gte: startOfDay,
            $lt: endOfDay
        },
        recordType: { $ne: 'waste' }
    });

    // 3. Get Milk Production
    const milkRecords = await Milk.find({
        date: {
            $gte: startOfDay,
            $lt: endOfDay
        }
    });
    const totalProduced = milkRecords.reduce((sum, record) => sum + record.quantity, 0);

    // 4. Get Milk Waste
    const wasteRecords = await Sales.find({
        date: {
            $gte: startOfDay,
            $lt: endOfDay
        },
        recordType: 'waste'
    });
    const totalWaste = wasteRecords.reduce((sum, record) => sum + record.quantityInLiters, 0);

    // 5. Merge Customer & Sales Data
    const data = customers.map((cust) => {
        const custSales = salesRecords.filter((s) => s.customerId === cust._id.toString());
        
        // Changed to use session field
        const morning = custSales.find((s) => s.session === 'morning');
        const evening = custSales.find((s) => s.session === 'evening');

        return {
            customerId: cust._id,
            name: cust.name,
            phone: cust.phone,
            rateGroup: cust.rateGroup,
            
            // Sales Data
            morningQty: morning ? morning.quantityInLiters : 0,
            morningFat: morning?.fat || 4.5,
            morningRate: morning?.pricePerLiter || cust.defaultMorningRate || 45,
            
            eveningQty: evening ? evening.quantityInLiters : 0,
            eveningFat: evening?.fat || 4.5,
            eveningRate: evening?.pricePerLiter || cust.defaultEveningRate || 45,
            
            morningId: morning?._id,
            eveningId: evening?._id
        };
    });

    return {
        results: data.length,
        data: {
            records: data,
            stats: {
                produced: totalProduced,
                waste: totalWaste
            }
        }
    };
});

export const bulkUpsertSales = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const records = req.body;

    if (!Array.isArray(records) || records.length === 0) {
        return { data: [] };
    }

    const operations = records.map((record) => {
        const localDate = new Date(record.date);
        
        return {
            updateOne: {
                filter: {
                    customerId: record.customerId,
                    date: localDate,
                    session: record.session // Using session directly
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

    const result = await Sales.bulkWrite(operations);

    return {
        data: result
    };
});

export const getSalesAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { startDate, endDate, customerId, groupBy = 'day', page = 1, limit = 10 } = req.query;

    const matchStage: any = {
        recordType: 'sale' // Exclude waste
    };

    if (startDate && endDate) {
        matchStage.date = {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string)
        };
    }

    if (customerId) {
        matchStage.customerId = customerId;
    }

    let groupId: any;
    if (groupBy === 'week') {
        groupId = { $week: "$date" };
    } else if (groupBy === 'month') {
        groupId = { $month: "$date" }; // Simplified, ideally year-month
    } else {
        // default day
        groupId = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
    }

    // For Week and Month, we really need Year-Week or Year-Month to avoid crossing years
    if (groupBy === 'week') {
        groupId = { 
            year: { $year: "$date" },
            week: { $week: "$date" }
        };
    } else if (groupBy === 'month') {
        groupId = { 
            year: { $year: "$date" },
            month: { $month: "$date" }
        };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: groupId,
                totalAmount: { $sum: "$totalAmount" },
                totalVolume: { $sum: "$quantityInLiters" },
                avgRate: { $avg: "$pricePerLiter" },
                avgFat: { $avg: "$fat" },
                count: { $sum: 1 },
                // Collect unique customers if grouping by time
                customers: { $addToSet: "$customerId" }
            }
        },
        {
            $project: {
                _id: 0,
                dateGroup: "$_id",
                totalAmount: 1,
                totalVolume: 1,
                avgRate: { $round: ["$avgRate", 2] },
                avgFat: { $round: ["$avgFat", 2] },
                count: 1,
                uniqueCustomers: { $size: "$customers" }
            }
        },
        { $sort: { "dateGroup": -1 } as any }, // Sort descending
        {
            $facet: {
                metadata: [
                    { $count: "total" },
                    { $addFields: { page: Number(page) } }
                ],
                data: [
                    { $skip: skip },
                    { $limit: Number(limit) }
                ]
            }
        }
    ];

    const stats = await Sales.aggregate(pipeline);
    
    const results = stats[0].data;
    const total = stats[0].metadata[0]?.total || 0;

    return {
        results: results.length,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: results
    };
});
