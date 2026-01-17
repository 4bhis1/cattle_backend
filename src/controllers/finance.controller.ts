import { Expense } from '../models/finance.model';
import * as factory from './handlerFactory';

export const getExpenses = factory.getAll(Expense);
export const getExpense = factory.getOne(Expense);
export const createExpense = factory.createOne(Expense);
export const updateExpense = factory.updateOne(Expense);
export const deleteExpense = factory.deleteOne(Expense);
