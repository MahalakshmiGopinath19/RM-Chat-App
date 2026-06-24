import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  employeeId: string;
  name: string;
  email: string;
  password?: string;
  department?: mongoose.Types.ObjectId;
  role: 'admin' | 'employee';
  status: 'active' | 'inactive' | 'blocked';
  avatar?: string;
  isOnline: boolean;
  lastActive?: Date;
  deviceInfo?: {
    browser?: string;
    os?: string;
    ip?: string;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' },
    avatar: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    deviceInfo: {
      browser: { type: String, default: '' },
      os: { type: String, default: '' },
      ip: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password || '', salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password helper
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password || '');
};

export default mongoose.model<IUser>('User', UserSchema);
