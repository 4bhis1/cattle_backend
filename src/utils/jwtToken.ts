import jwt from 'jsonwebtoken';
import { AppError } from './AppError';

export const generateAccessToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT Secret is required.', 500);
  }

  return jwt.sign({ userId }, secret, {
    algorithm: 'HS256',
    expiresIn: '1d' // Added expiration
  });
};

export const authenticateToken = (token: string) => {
  if (!token) {
    throw new AppError('Access Token Required', 401);
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT Secret is required.', 500);
  }

  try {
    // Expecting raw token here, stripping Bearer handled in middleware
    const payload: any = jwt.verify(token, secret);
    return payload.userId;
  } catch (error) {
    throw new AppError('Invalid Token', 403);
  }
};
