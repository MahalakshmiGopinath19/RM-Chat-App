import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4'; // P1 (Urgent), P2 (High), P3 (Medium), P4 (Low)
  assignedTo: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  status: 'todo' | 'in_progress' | 'completed';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    priority: { type: String, enum: ['P1', 'P2', 'P3', 'P4'], default: 'P3' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['todo', 'in_progress', 'completed'], default: 'todo' },
    dueDate: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model<ITask>('Task', TaskSchema);
