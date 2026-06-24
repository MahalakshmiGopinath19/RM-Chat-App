import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  user?: mongoose.Types.ObjectId;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
  action: { type: String, required: true }, // e.g. LOGIN, LOGOUT, FILE_UPLOAD, FILE_DOWNLOAD, etc.
  user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  details: { type: String, required: true },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
