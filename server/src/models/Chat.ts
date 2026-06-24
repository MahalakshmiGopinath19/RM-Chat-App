import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  type: 'direct' | 'group' | 'department' | 'team';
  participants: mongoose.Types.ObjectId[];
  department?: mongoose.Types.ObjectId;
  team?: mongoose.Types.ObjectId;
  name?: string;
  pinnedBy: mongoose.Types.ObjectId[];
  starredBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema = new Schema(
  {
    type: { type: String, enum: ['direct', 'group', 'department', 'team'], required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    team: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    name: { type: String, trim: true, default: '' },
    pinnedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    starredBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

export default mongoose.model<IChat>('Chat', ChatSchema);
