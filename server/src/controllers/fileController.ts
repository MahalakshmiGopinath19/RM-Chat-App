import { Response } from 'express';
import File from '../models/File';
import Team from '../models/Team';
import Chat from '../models/Chat';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';
import mongoose from 'mongoose';

// Upload file with versioning support
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded.' });
      return;
    }
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { accessType, targetId } = req.body; // accessType: public, department, team, private
    
    // Check if user has uploaded a file with same name and same target previously
    let existingFile = await File.findOne({
      originalName: req.file.originalname,
      owner: req.user._id,
      'accessControl.type': accessType || 'public',
      'accessControl.targetId': targetId ? new mongoose.Types.ObjectId(targetId) : null
    });

    if (existingFile) {
      // Save current file details into versions array
      existingFile.versions.push({
        filename: existingFile.filename,
        originalName: existingFile.originalName,
        path: existingFile.path,
        size: existingFile.size,
        uploadedAt: existingFile.createdAt // Use schema createdAt for old versions
      });

      // Update primary details with new file info
      existingFile.filename = req.file.filename;
      existingFile.path = req.file.path;
      existingFile.size = req.file.size;
      existingFile.version += 1;

      await existingFile.save();
      await logAudit(
        'FILE_VERSION_UPLOAD',
        req.user._id,
        `Uploaded version ${existingFile.version} of file: ${req.file.originalname}`,
        req
      );

      res.status(200).json(existingFile);
      return;
    }

    // Create new file record
    const newFile = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      owner: req.user._id,
      accessControl: {
        type: accessType || 'public',
        targetId: targetId ? new mongoose.Types.ObjectId(targetId) : null
      }
    });

    await newFile.save();
    await logAudit(
      'FILE_UPLOAD',
      req.user._id,
      `Uploaded file: ${req.file.originalname} (Access: ${accessType || 'public'})`,
      req
    );

    res.status(201).json(newFile);
  } catch (error: any) {
    res.status(500).json({ message: 'Upload error.', error: error.message });
  }
};

// Secure File Download with Role Access Control Checks
export const downloadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const file = await File.findById(id);
    if (!file) {
      res.status(404).json({ message: 'File not found.' });
      return;
    }

    // Access control evaluation
    let hasAccess = false;

    if (req.user.role === 'admin') {
      hasAccess = true;
    } else {
      const accessType = file.accessControl.type;
      const targetId = file.accessControl.targetId;

      if (accessType === 'public') {
        hasAccess = true;
      } else if (accessType === 'department') {
        hasAccess = req.user.department?.toString() === targetId?.toString();
      } else if (accessType === 'team') {
        const team = await Team.findById(targetId);
        hasAccess = team ? team.members.some(m => m.toString() === req.user!._id.toString()) : false;
      } else if (accessType === 'private') {
        // Owner has access
        if (file.owner.toString() === req.user._id.toString()) {
          hasAccess = true;
        } else if (targetId) {
          // If uploaded in a chat context, verify membership
          const chat = await Chat.findById(targetId);
          if (chat) {
            hasAccess = chat.participants.some(p => p.toString() === req.user!._id.toString());
          }
        }
      }
    }

    if (!hasAccess) {
      res.status(403).json({ message: 'You do not have permission to access this file.' });
      return;
    }

    // Track download
    file.downloads.push({
      user: req.user._id,
      timestamp: new Date()
    });
    await file.save();

    await logAudit(
      'FILE_DOWNLOAD',
      req.user._id,
      `Downloaded file: ${file.originalName}`,
      req
    );

    // Stream download
    res.download(file.path, file.originalName);
  } catch (error: any) {
    res.status(500).json({ message: 'Download error.', error: error.message });
  }
};

// Search / list files available to the user
export const getFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { search, fileType } = req.query;

    // Find all teams this user is a member of
    const userTeams = await Team.find({ members: req.user._id });
    const teamIds = userTeams.map(t => t._id);

    // Build accessibility filter
    const authFilter: any[] = [
      { 'accessControl.type': 'public' },
      { owner: req.user._id },
      { 'accessControl.type': 'department', 'accessControl.targetId': req.user.department }
    ];

    if (teamIds.length > 0) {
      authFilter.push({ 'accessControl.type': 'team', 'accessControl.targetId': { $in: teamIds } });
    }

    const query: any = {
      $or: authFilter
    };

    // Keyword search
    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    // Extension filters
    if (fileType) {
      // Maps groups (e.g. image, document, archive) to regex
      let extensions: string[] = [];
      if (fileType === 'image') extensions = ['.jpg', '.jpeg', '.png'];
      else if (fileType === 'document') extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
      else if (fileType === 'archive') extensions = ['.zip'];

      if (extensions.length > 0) {
        query.originalName = {
          $regex: `(${extensions.map(ext => ext.replace('.', '\\.')).join('|')})$`,
          $options: 'i'
        };
      }
    }

    const files = await File.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(files);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
