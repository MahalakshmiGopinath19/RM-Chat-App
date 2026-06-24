import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description?: string;
  department?: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
}

const TeamSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

export default mongoose.model<ITeam>('Team', TeamSchema);
