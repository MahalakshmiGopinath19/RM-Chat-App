import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

// Get current user info
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const user = await User.findById(req.user._id).populate('department', 'name');
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Update personal profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    await logAudit('PROFILE_UPDATE', user._id, `User updated profile details`, req);

    res.status(200).json({ message: 'Profile updated successfully.', user });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Get all employees (Searchable by Name, ID, Department)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, department, status } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (status) {
      query.status = status;
    }

    const users = await User.find(query)
      .populate('department', 'name')
      .select('-password')
      .sort({ name: 1 });

    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Admin: Add Employee
export const addEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, name, email, password, department, role } = req.body;

    if (!employeeId || !name || !email || !password) {
      res.status(400).json({ message: 'All fields are required.' });
      return;
    }

    // Check if ID or Email already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { employeeId: employeeId.trim() }]
    });

    if (existingUser) {
      res.status(400).json({ message: 'Employee ID or Email already exists.' });
      return;
    }

    const newUser = new User({
      employeeId,
      name,
      email,
      password,
      department: department || null,
      role: role || 'employee'
    });

    await newUser.save();

    await logAudit(
      'USER_CREATE',
      req.user?._id || null,
      `Admin created new employee: ${email} (${employeeId})`,
      req
    );

    res.status(201).json({ message: 'Employee created successfully.', user: { id: newUser._id, employeeId, name, email } });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Admin: Edit Employee Details
export const editEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, department, role, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (department !== undefined) user.department = department || undefined;
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    if (status && (status === 'blocked' || status === 'inactive')) {
      const io = req.app.get('socketio');
      if (io) {
        io.to(`user_${id}`).emit('kick', { message: `Your account has been set to ${status} by an admin.` });
        const socketsInRoom = await io.in(`user_${id}`).fetchSockets();
        socketsInRoom.forEach((s: any) => s.disconnect(true));
      }
    }

    await logAudit(
      'USER_UPDATE',
      req.user?._id || null,
      `Admin updated details for user ID: ${id} (${user.email})`,
      req
    );

    res.status(200).json({ message: 'Employee updated successfully.', user });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Admin: Remove/Delete Employee
export const removeEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    // Instead of deleting, we can deactivate or delete based on input. Let's delete it.
    await User.findByIdAndDelete(id);

    const io = req.app.get('socketio');
    if (io) {
      io.to(`user_${id}`).emit('kick', { message: 'Your account has been deleted by an admin.' });
      const socketsInRoom = await io.in(`user_${id}`).fetchSockets();
      socketsInRoom.forEach((s: any) => s.disconnect(true));
    }

    await logAudit(
      'USER_DELETE',
      req.user?._id || null,
      `Admin deleted employee: ${user.email} (${user.employeeId})`,
      req
    );

    res.status(200).json({ message: 'Employee deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
