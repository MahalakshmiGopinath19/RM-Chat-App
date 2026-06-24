import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-company-key';

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token = '';

    // Extract from Bearer Token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Fallback: Extract from cookies (if we use cookie-parser later)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Fallback: Query param (often used for websockets/downloads)
    else if (req.query && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ message: 'User not found.' });
      return;
    }

    if (user.status === 'blocked') {
      res.status(403).json({ message: 'Account has been blocked by administrator.' });
      return;
    }

    if (user.status === 'inactive') {
      res.status(403).json({ message: 'Account is deactivated.' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ message: 'Invalid or expired token.', error: error.message });
  }
};

// Check if user is Admin
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Administrators only.' });
  }
};

// Check if user is active employee
export const requireActive = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.status === 'active') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Account is not active.' });
  }
};
