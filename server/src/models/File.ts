import mongoose, { Schema, Document } from 'mongoose';

export interface IFileVersion {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  uploadedAt: Date;
}

export interface IFile extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  owner: mongoose.Types.ObjectId;
  accessControl: {
    type: 'public' | 'department' | 'team' | 'private';
    targetId?: mongoose.Types.ObjectId;
  };
  version: number;
  versions: IFileVersion[];
  downloads: Array<{
    user: mongoose.Types.ObjectId;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema: Schema = new Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accessControl: {
      type: { type: String, enum: ['public', 'department', 'team', 'private'], default: 'public' },
      targetId: { type: Schema.Types.ObjectId, default: null }
    },
    version: { type: Number, default: 1 },
    versions: [
      {
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        path: { type: String, required: true },
        size: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    downloads: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model<IFile>('File', FileSchema);
