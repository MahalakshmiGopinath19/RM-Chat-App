import { Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-company-key';

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loginId, password, deviceInfo } = req.body; // loginId can be email or employeeId

    if (!loginId || !password) {
      res.status(400).json({ message: 'Login ID (Email/Employee ID) and password are required.' });
      return;
    }

    // Search user by email or employee ID
    const user = await User.findOne({
      $or: [
        { email: loginId.toLowerCase() },
        { employeeId: loginId.trim() }
      ]
    });

    if (!user) {
      await logAudit('LOGIN_FAILED', null, `Failed login attempt with ID: ${loginId}`, req);
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    if (user.status === 'blocked') {
      await logAudit('LOGIN_FAILED', user._id, 'Blocked user attempted login', req);
      res.status(403).json({ message: 'Your account has been blocked. Contact administrator.' });
      return;
    }

    if (user.status === 'inactive') {
      await logAudit('LOGIN_FAILED', user._id, 'Inactive user attempted login', req);
      res.status(403).json({ message: 'Your account is currently inactive.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAudit('LOGIN_FAILED', user._id, 'Incorrect password entered', req);
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    // Update user login details
    user.isOnline = true;
    user.lastActive = new Date();
    if (deviceInfo) {
      user.deviceInfo = {
        browser: deviceInfo.browser || '',
        os: deviceInfo.os || '',
        ip: req.ip || req.socket.remoteAddress || ''
      };
    }
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    // Remove password from output
    const userResponse = user.toObject();
    delete userResponse.password;

    await logAudit('LOGIN_SUCCESS', user._id, `User logged in successfully: ${user.email}`, req);

    res.status(200).json({
      token,
      user: userResponse
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Login server error.', error: error.message });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.isOnline = false;
        user.lastActive = new Date();
        await user.save();
      }
      await logAudit('LOGOUT', req.user._id, `User logged out: ${req.user.email}`, req);
    }
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Logout server error.', error: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      res.status(400).json({ message: 'Old and new passwords are required.' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      res.status(400).json({ message: 'Incorrect old password.' });
      return;
    }

    user.password = newPassword;
    await user.save();

    await logAudit('PASSWORD_CHANGED', user._id, `Password changed successfully`, req);
    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Change password server error.', error: error.message });
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  // Return message to contact administrator, since it's a closed enterprise system
  const { email } = req.body;
  await logAudit('PASSWORD_RESET_REQUEST', null, `Password reset requested for email: ${email}`, req);
  res.status(200).json({
    message: 'If the email exists in our records, a request has been logged. Please contact your company IT administrator to reset your credentials.'
  });
};
