import { Feed, FeedInStock } from '../models/feed.model';
import * as factory from './handlerFactory';

export const getFeeds = factory.getAll(Feed);
export const getFeed = factory.getOne(Feed);
export const createFeed = factory.createOne(Feed);
export const updateFeed = factory.updateOne(Feed);
export const deleteFeed = factory.deleteOne(Feed);

export const getFeedStocks = factory.getAll(FeedInStock);
export const getFeedStock = factory.getOne(FeedInStock);
export const createFeedStock = factory.createOne(FeedInStock);
export const updateFeedStock = factory.updateOne(FeedInStock);
export const deleteFeedStock = factory.deleteOne(FeedInStock);
