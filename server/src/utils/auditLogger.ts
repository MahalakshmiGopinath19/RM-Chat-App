import { Request } from 'express';
import AuditLog from '../models/AuditLog';
import mongoose from 'mongoose';

export const logAudit = async (
  action: string,
  userId: string | mongoose.Types.ObjectId | null,
  details: string,
  req?: Request
): Promise<void> => {
  try {
    const ipAddress = req ? req.ip || req.socket.remoteAddress || '' : 'system';
    const userAgent = req ? req.headers['user-agent'] || '' : 'system';

    const auditLog = new AuditLog({
      action,
      user: userId,
      details,
      ipAddress,
      userAgent
    });

    await auditLog.save();
    console.log(`[AUDIT] Action: ${action} | Details: ${details}`);
  } catch (error) {
    console.error('Failed to save audit log:', error);
  }
};
