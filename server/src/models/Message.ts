import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  attachments: mongoose.Types.ObjectId[];
  readBy: Array<{
    user: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
  reactions: Array<{
    user: mongoose.Types.ObjectId;
    emoji: string;
  }>;
  parentMessageId?: mongoose.Types.ObjectId;
  isEdited: boolean;
  isDeleted: boolean;
  starredBy: mongoose.Types.ObjectId[];
}

const MessageSchema: Schema = new Schema(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '' },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    readBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        readAt: { type: Date, default: Date.now }
      }
    ],
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        emoji: { type: String, required: true }
      }
    ],
    parentMessageId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    starredBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
