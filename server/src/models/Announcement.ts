import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'critical';
  audienceType: 'company' | 'department' | 'team';
  audienceId?: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  publishDate: Date;
  expiryDate?: Date;
}

const AnnouncementSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    priority: { type: String, enum: ['normal', 'important', 'critical'], default: 'normal' },
    audienceType: { type: String, enum: ['company', 'department', 'team'], required: true },
    audienceId: { type: Schema.Types.ObjectId, default: null }, // Refers to Department or Team based on audienceType
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publishDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
