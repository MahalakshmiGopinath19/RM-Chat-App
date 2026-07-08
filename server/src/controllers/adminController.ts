import { Response } from 'express';
import User from '../models/User';
import Message from '../models/Message';
import Chat from '../models/Chat';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, userId } = req.query;
    const query: any = {};

    if (action) {
      query.action = action;
    }
    if (userId) {
      query.user = userId;
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'name email employeeId')
      .sort({ timestamp: -1 })
      .limit(200);

    res.status(200).json(logs);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const getSystemStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const totalMessages = await Message.countDocuments();
    const totalChats = await Chat.countDocuments();
    const onlineUsersList = await User.find({ isOnline: true }, 'name email employeeId avatar role').sort({ name: 1 });

    // Messages per day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const messageStats = await Message.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Active departments/teams message distribution
    const deptStats = await Message.aggregate([
      {
        $lookup: {
          from: 'chats',
          localField: 'chat',
          foreignField: '_id',
          as: 'chatDetails'
        }
      },
      { $unwind: '$chatDetails' },
      { $match: { 'chatDetails.type': 'department' } },
      {
        $lookup: {
          from: 'departments',
          localField: 'chatDetails.department',
          foreignField: '_id',
          as: 'deptDetails'
        }
      },
      { $unwind: '$deptDetails' },
      {
        $group: {
          _id: '$deptDetails.name',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      summary: {
        totalUsers,
        onlineUsers,
        totalMessages,
        totalChats,
        onlineUsersList
      },
      messageStats,
      deptStats
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const exportReportExcel = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('User Activity Summary');

    sheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Online Status', key: 'isOnline', width: 15 },
      { header: 'Last Active', key: 'lastActive', width: 25 }
    ];

    const users = await User.find().sort({ name: 1 });
    users.forEach(user => {
      sheet.addRow({
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isOnline: user.isOnline ? 'Online' : 'Offline',
        lastActive: user.lastActive ? user.lastActive.toISOString() : 'Never'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Company_User_Report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).json({ message: 'Excel generation error.', error: error.message });
  }
};

export const exportReportPDF = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Platform_Summary_Report.pdf');

    doc.pipe(res);

    // Title
    doc.fontSize(22).text('Enterprise Chat Application', { align: 'center' });
    doc.fontSize(16).text('Platform Summary Report', { align: 'center' });
    doc.moveDown();

    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const totalMessages = await Message.countDocuments();
    const totalChats = await Chat.countDocuments();

    doc.fontSize(12).text(`Report Date: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(14).text('System Summary Statistics:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total Registered Users: ${totalUsers}`);
    doc.text(`Current Online Users: ${onlineUsers}`);
    doc.text(`Total Chat Rooms: ${totalChats}`);
    doc.text(`Total Messages Sent: ${totalMessages}`);
    doc.moveDown();

    doc.fontSize(14).text('Recent Platform System Audits:', { underline: true });
    doc.moveDown(0.5);

    const audits = await AuditLog.find().sort({ timestamp: -1 }).limit(10);
    audits.forEach(audit => {
      doc.fontSize(10).text(
        `[${audit.timestamp.toISOString()}] ${audit.action} - ${audit.details}`
      );
    });

    doc.end();
  } catch (error: any) {
    res.status(500).json({ message: 'PDF generation error.', error: error.message });
  }
};
