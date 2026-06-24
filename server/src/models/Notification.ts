import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: 'chat' | 'announcement' | 'task';
  content: string;
  referenceId?: mongoose.Types.ObjectId;
  status: 'unread' | 'read';
}

const NotificationSchema: Schema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['chat', 'announcement', 'task'], required: true },
    content: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId, default: null }, // e.g., Message ID or Announcement ID
    status: { type: String, enum: ['unread', 'read'], default: 'unread' }
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
