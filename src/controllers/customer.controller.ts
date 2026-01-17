import { Request, Response, NextFunction } from 'express';
import Customer from '../models/customer.model';
import * as factory from './handlerFactory';

export const getAllCustomers = factory.getAll(Customer);
export const getCustomer = factory.getOne(Customer);
export const createCustomer = factory.createOne(Customer);
export const updateCustomer = factory.updateOne(Customer);
export const deleteCustomer = factory.deleteOne(Customer);
