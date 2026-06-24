import { Response } from 'express';
import Department from '../models/Department';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export const getDepartments = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await Department.find().populate('head', 'name email employeeId');
    res.status(200).json(departments);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, head } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Department name is required.' });
      return;
    }

    const existing = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      res.status(400).json({ message: 'Department already exists.' });
      return;
    }

    const dept = new Department({
      name,
      description,
      head: head || null
    });
    await dept.save();

    await logAudit(
      'DEPARTMENT_CREATE',
      req.user?._id || null,
      `Admin created department: ${name}`,
      req
    );

    res.status(201).json(dept);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, head } = req.body;

    const dept = await Department.findById(id);
    if (!dept) {
      res.status(404).json({ message: 'Department not found.' });
      return;
    }

    if (name) dept.name = name;
    if (description !== undefined) dept.description = description;
    if (head !== undefined) dept.head = head || undefined;

    await dept.save();

    await logAudit(
      'DEPARTMENT_UPDATE',
      req.user?._id || null,
      `Admin updated department ID: ${id} (${dept.name})`,
      req
    );

    res.status(200).json(dept);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const assignDepartmentHead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { headId } = req.body;

    const dept = await Department.findById(id);
    if (!dept) {
      res.status(404).json({ message: 'Department not found.' });
      return;
    }

    dept.head = headId || null;
    await dept.save();

    await logAudit(
      'DEPARTMENT_ASSIGN_HEAD',
      req.user?._id || null,
      `Admin assigned head to department: ${dept.name}`,
      req
    );

    res.status(200).json(dept);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
