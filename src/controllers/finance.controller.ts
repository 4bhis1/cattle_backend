import { Expense, Sales } from '../models/finance.model';
import { Income } from '../models/income.model';
import * as factory from './handlerFactory';
import { catchAsync } from '../utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import dayjs from 'dayjs';

// Expense CRUD
export const getExpenses = factory.getAll(Expense);
export const getExpense = factory.getOne(Expense);
export const createExpense = factory.createOne(Expense);
export const updateExpense = factory.updateOne(Expense);
export const deleteExpense = factory.deleteOne(Expense);

// Income CRUD
export const getIncomes = factory.getAll(Income);
export const getIncome = factory.getOne(Income);
export const deleteIncome = factory.deleteOne(Income);
export const updateIncome = factory.updateOne(Income);

// Custom Create Income (handling Milk Sales reconciliation)
export const createIncome = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { source, amount, date, paymentMethod, relatedCustomerId, transactionIds, description, organisation_id } = req.body;

    // 1. Create the Income Record
    const newIncome = await Income.create({
        source,
        amount,
        date,
        paymentMethod,
        relatedCustomerId,
        transactionIds, // Optional, linked to sales
        description,
        organisation_id
    });

    // 2. If Source is Milk Sale and TransactionIDs are provided, update Sales records
    if (source === 'milk_sale' && transactionIds && transactionIds.length > 0) {
        await Sales.updateMany(
            { _id: { $in: transactionIds } },
            { 
                $set: { 
                    paymentStatus: 'paid',
                    paymentDate: date,
                    paymentMethod: paymentMethod
                }
            }
        );
    }

    res.status(201).json({
        status: 'success',
        data: {
            data: newIncome
        }
    });
});

// Get Combined Transactions (All Tab)
export const getAllTransactions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { startDate, endDate, limit = 10, page = 1 } = req.query;
    
    const filter: any = {};
    if (startDate && endDate) {
        // Fix: Set End Date to End of Day
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        
        filter.date = {
            $gte: new Date(startDate as string),
            $lte: end
        };
    }

    // Fetch Income and Expense
    // Use factory-like query or direct mongoose
    const expenseQuery = Expense.find(filter).lean();
    const incomeQuery = Income.find(filter).lean();
    
    const [expenses, incomes] = await Promise.all([expenseQuery, incomeQuery]);

    // Combine and mark type
    const combined = [
        ...expenses.map(e => ({ ...e, type: 'expense' })),
        ...incomes.map(i => ({ ...i, type: 'income' }))
    ];

    // Sort by date desc
    combined.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Pagination (manual since we combined)
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const total = combined.length;
    const paginated = combined.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    
    // Calculate Totals for period (regardless of pagination)
    const totalIncome = incomes.reduce((sum, i: any) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e: any) => sum + e.amount, 0);

    res.status(200).json({
        status: 'success',
        results: paginated.length,
        total,
        totalPages: Math.ceil(total / limitNum),
        data: paginated,
        summary: {
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense
        }
    });
});

// Analytics (Chart Data) - Updated for new Income Model
export const getProfitLossAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { startDate, endDate, groupBy = 'day', page = 1, limit = 10 } = req.query;

    const matchStage: any = {};
    if (startDate && endDate) {
        // Fix: Set End Date to End of Day
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);

        matchStage.date = {
            $gte: new Date(startDate as string),
            $lte: end
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

    // 1. Aggregate Expenses
    const expensePipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: groupId,
                expense: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        }
    ];

    // 2. Aggregate Income (Generic)
    const incomePipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: groupId,
                income: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        }
    ];

    // 3. Aggregate Sales (Milk Income - wait, MILK INCOME IS NOW IN INCOME TABLE??)
    // User Requirement: "The sales is a table where we ae maintinag the data where as income will be the table where we will store the money which we have received."
    // So if money is received, it goes to Income table.
    // DOES SALES TABLE REPRESENT MONEY? Or just records?
    // "Money Coming Tab" will show Income.
    // Does Income table capture ALL money coming?
    // Plan says: "If Source is Milk Sale... Create Income doc."
    // So YES, Income Table now holds the money. Sales holds the product record.
    // So Analytics should aggregation ONLY Expense and Income tables.
    // NO NEED TO AGGREGATE SALES TABLE for Money/Profit anymore, because actual money is in Income table.
    // VERIFY this assumption from Plan.
    // Plan: "Milk Logic: ... Create Income doc."
    // So yes, I query Income table for revenue.

    const [expenseStats, incomeStats] = await Promise.all([
        Expense.aggregate(expensePipeline),
        Income.aggregate(incomePipeline)
    ]);

    // 3. Merge Data
    const mergedMap = new Map<string, any>();

    const getKey = (id: any) => {
        if (typeof id === 'string') return id;
        return `${id.year}-${id.month || id.week}`; 
    };

    expenseStats.forEach(stat => {
        const key = JSON.stringify(stat._id);
        mergedMap.set(key, {
            dateGroup: stat._id,
            expense: stat.expense,
            income: 0,
            txCount: stat.count
        });
    });

    incomeStats.forEach(stat => {
        const key = JSON.stringify(stat._id);
        if (mergedMap.has(key)) {
            const existing = mergedMap.get(key);
            existing.income += stat.income;
            existing.txCount += stat.count;
        } else {
            mergedMap.set(key, {
                dateGroup: stat._id,
                expense: 0,
                income: stat.income,
                txCount: stat.count
            });
        }
    });

    let results = Array.from(mergedMap.values());

    // Sort
    results.sort((a, b) => {
         const da = a.dateGroup.year || a.dateGroup;
         const db = b.dateGroup.year || b.dateGroup;
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

    const totalIncome = results.reduce((sum, r) => sum + r.income, 0);
    const totalExpense = results.reduce((sum, r) => sum + r.expense, 0);

    res.status(200).json({
        status: 'success',
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
    });
});
