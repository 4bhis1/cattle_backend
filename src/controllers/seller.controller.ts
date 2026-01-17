import Seller from '../models/seller.model';
import { createOne, getAll, getOne, updateOne, deleteOne } from './handlerFactory';

export const createSeller = createOne(Seller);
export const getAllSellers = getAll(Seller);
export const getSeller = getOne(Seller);
export const updateSeller = updateOne(Seller);
export const deleteSeller = deleteOne(Seller);
