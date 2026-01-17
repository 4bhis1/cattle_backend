import { DailyReport } from '../models/other.model';
import * as factory from './handlerFactory';

export const getDailyReports = factory.getAll(DailyReport);
export const getDailyReport = factory.getOne(DailyReport);
export const createDailyReport = factory.createOne(DailyReport);
export const updateDailyReport = factory.updateOne(DailyReport);
export const deleteDailyReport = factory.deleteOne(DailyReport);
