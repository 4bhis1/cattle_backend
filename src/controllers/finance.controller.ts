import { Expense, Sales } from '../models/finance.model';
import * as factory from './handlerFactory';
import { catchAsync } from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';

export const getExpenses = factory.getAll(Expense);
export const getExpense = factory.getOne(Expense);
export const createExpense = factory.createOne(Expense);
export const updateExpense = factory.updateOne(Expense);
export const deleteExpense = factory.deleteOne(Expense);

export const getProfitLossAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { startDate, endDate, groupBy = 'day', page = 1, limit = 10 } = req.query;

    const matchStage: any = {};
    if (startDate && endDate) {
        matchStage.date = {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string)
        };
    }

    let groupId: any;
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
    } else {
        groupId = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
    }

    // 1. Aggregate Expenses & Other Income
    const expensePipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: groupId,
                expense: { 
                    $sum: { 
                        $cond: [{ $eq: ["$recordType", "expense"] }, "$amount", 0] 
                    } 
                },
                otherIncome: { 
                    $sum: { 
                        $cond: [{ $eq: ["$recordType", "income"] }, "$amount", 0] 
                    } 
                },
                count: { $sum: 1 }
            }
        }
    ];

    // 2. Aggregate Sales (Milk Income)
    const salesPipeline = [
        { 
            $match: {
                 ...matchStage,
                 recordType: 'sale'
            } 
        },
        {
            $group: {
                _id: groupId,
                milkIncome: { $sum: "$totalAmount" },
                salesCount: { $sum: 1 }
            }
        }
    ];

    const [expenseStats, salesStats] = await Promise.all([
        Expense.aggregate(expensePipeline),
        Sales.aggregate(salesPipeline)
    ]);

    // 3. Merge Data
    const mergedMap = new Map<string, any>();

    const getKey = (id: any) => {
        if (typeof id === 'string') return id;
        return `${id.year}-${id.month || id.week}`; // Simple unique key
    };

    expenseStats.forEach(stat => {
        const key = JSON.stringify(stat._id);
        mergedMap.set(key, {
            dateGroup: stat._id,
            expense: stat.expense,
            otherIncome: stat.otherIncome,
            income: stat.otherIncome, // Initial income
            txCount: stat.count
        });
    });

    salesStats.forEach(stat => {
        const key = JSON.stringify(stat._id);
        if (mergedMap.has(key)) {
            const existing = mergedMap.get(key);
            existing.income += stat.milkIncome;
            existing.milkIncome = stat.milkIncome; // Track separately for details if needed
            existing.txCount += stat.salesCount;
        } else {
            mergedMap.set(key, {
                dateGroup: stat._id,
                expense: 0,
                otherIncome: 0,
                income: stat.milkIncome,
                milkIncome: stat.milkIncome,
                txCount: stat.salesCount
            });
        }
    });

    let results = Array.from(mergedMap.values());

    // Sort
    results.sort((a, b) => {
        const da = a.dateGroup.year || a.dateGroup; // String comparison work for YYYY-MM-DD
        const db = b.dateGroup.year || b.dateGroup;
        // If objects (week/month), compare fields
        if (typeof a.dateGroup !== 'string') {
             if (a.dateGroup.year !== b.dateGroup.year) return b.dateGroup.year - a.dateGroup.year;
             return (b.dateGroup.month || b.dateGroup.week) - (a.dateGroup.month || a.dateGroup.week);
        }
        return db.localeCompare(da);
    });

    // Pagination
    const total = results.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedResults = results.slice(skip, skip + Number(limit));

    // Calculate Totals for period
    const totalIncome = results.reduce((sum, r) => sum + r.income, 0);
    const totalExpense = results.reduce((sum, r) => sum + r.expense, 0);

    return {
        results: paginatedResults.length,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        data: paginatedResults,
        summary: {
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense
        }
    };
});
