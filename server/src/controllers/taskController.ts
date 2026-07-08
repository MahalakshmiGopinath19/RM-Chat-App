import { Response } from 'express';
import Task from '../models/Task';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';
import Notification from '../models/Notification';

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const role = req.user?.role;
    const { status, priority, filter } = req.query;

    const query: any = {};

    // Apply filtering based on role and query parameters
    if (role === 'admin') {
      // Admins can see all tasks, but can filter by assignee/creator if specified
      if (filter === 'assigned_to_me') {
        query.assignedTo = userId;
      } else if (filter === 'created_by_me') {
        query.assignedBy = userId;
      }
    } else {
      // Regular employees can see:
      // 1. Tasks assigned to them
      // 2. Tasks created by them
      if (filter === 'assigned_to_me') {
        query.assignedTo = userId;
      } else if (filter === 'created_by_me') {
        query.assignedBy = userId;
      } else {
        // Default: tasks assigned to or created by them
        query.$or = [{ assignedTo: userId }, { assignedBy: userId }];
      }
    }

    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }

    // Sort alphabetically by priority (P1, P2, P3, P4) and then by dueDate
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email employeeId avatar role')
      .populate('assignedBy', 'name email employeeId avatar role')
      .sort({ priority: 1, dueDate: 1 });

    res.status(200).json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error retrieving tasks.', error: error.message });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.user?._id;
    const { title, description, priority, assignedTo, dueDate } = req.body;

    if (!title || !assignedTo) {
      res.status(400).json({ message: 'Task title and assignee are required.' });
      return;
    }

    // Verify assigned user exists
    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      res.status(404).json({ message: 'Assignee not found.' });
      return;
    }

    const task = new Task({
      title,
      description: description || '',
      priority: priority || 'P3',
      assignedTo,
      assignedBy: creatorId,
      dueDate: dueDate || undefined,
      status: 'todo'
    });

    await task.save();

    await logAudit('TASK_CREATE', creatorId || null, `Task created: "${title}" assigned to ${assignee.name}`, req);

    // Create real-time task notification if assigned to someone else
    if (assignedTo.toString() !== creatorId?.toString()) {
      const notification = new Notification({
        recipient: assignedTo,
        type: 'task',
        content: `You have been assigned a new ${priority || 'P3'} task: "${title}" by ${req.user?.name}`,
        referenceId: task._id
      });
      await notification.save();

      // Trigger socket event
      const io = req.app.get('socketio');
      if (io) {
        io.to(`user_${assignedTo}`).emit('notification', notification);
      }
    }

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email employeeId avatar role')
      .populate('assignedBy', 'name email employeeId avatar role');

    res.status(201).json(populatedTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error creating task.', error: error.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const role = req.user?.role;
    const { id } = req.params;
    const { title, description, priority, assignedTo, dueDate, status } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found.' });
      return;
    }

    // Check permissions: only creator, assignee, or admin can edit
    const isCreator = task.assignedBy.toString() === userId?.toString();
    const isAssignee = task.assignedTo.toString() === userId?.toString();
    const isAdmin = role === 'admin';

    if (!isCreator && !isAssignee && !isAdmin) {
      res.status(403).json({ message: 'Unauthorized to modify this task.' });
      return;
    }

    // Restrict what assignee can edit (typically just status, unless they are also creator/admin)
    if (isAssignee && !isCreator && !isAdmin) {
      // Assignee can only modify status
      if (status) task.status = status;
    } else {
      // Creators and admins can modify everything
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || undefined;
      if (status !== undefined) task.status = status;

      if (assignedTo !== undefined) {
        const newAssignee = await User.findById(assignedTo);
        if (newAssignee) {
          task.assignedTo = assignedTo;
        }
      }
    }

    await task.save();

    await logAudit('TASK_UPDATE', userId || null, `Task updated: "${task.title}" (Status: ${task.status})`, req);

    // Notify assignee if status changed by someone else
    if (status && task.assignedTo.toString() !== userId?.toString()) {
      const notification = new Notification({
        recipient: task.assignedTo,
        type: 'task',
        content: `Your task "${task.title}" status was updated to ${status.replace('_', ' ')} by ${req.user?.name}`,
        referenceId: task._id
      });
      await notification.save();

      const io = req.app.get('socketio');
      if (io) {
        io.to(`user_${task.assignedTo}`).emit('notification', notification);
      }
    }

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email employeeId avatar role')
      .populate('assignedBy', 'name email employeeId avatar role');

    res.status(200).json(populatedTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error updating task.', error: error.message });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const role = req.user?.role;
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found.' });
      return;
    }

    // Only creator or admin can delete
    const isCreator = task.assignedBy.toString() === userId?.toString();
    const isAdmin = role === 'admin';

    if (!isCreator && !isAdmin) {
      res.status(403).json({ message: 'Unauthorized to delete this task.' });
      return;
    }

    await Task.findByIdAndDelete(id);

    await logAudit('TASK_DELETE', userId || null, `Task deleted: "${task.title}"`, req);

    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error deleting task.', error: error.message });
  }
};
