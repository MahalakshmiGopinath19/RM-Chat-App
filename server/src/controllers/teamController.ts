import { Response } from 'express';
import Team from '../models/Team';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export const getTeams = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teams = await Team.find()
      .populate('department', 'name')
      .populate('members', 'name email employeeId role isOnline');
    res.status(200).json(teams);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, department, members } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Team name is required.' });
      return;
    }

    const team = new Team({
      name,
      description,
      department: department || null,
      members: members || []
    });
    await team.save();

    await logAudit(
      'TEAM_CREATE',
      req.user?._id || null,
      `Admin/Manager created team: ${name}`,
      req
    );

    res.status(201).json(team);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const addTeamMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userIds } = req.body; // Array of user IDs

    if (!userIds || !Array.isArray(userIds)) {
      res.status(400).json({ message: 'User IDs array is required.' });
      return;
    }

    const team = await Team.findById(id);
    if (!team) {
      res.status(404).json({ message: 'Team not found.' });
      return;
    }

    // Add unique members
    const currentMembers = team.members.map(m => m.toString());
    userIds.forEach(userId => {
      if (!currentMembers.includes(userId)) {
        team.members.push(userId);
      }
    });

    await team.save();
    await logAudit(
      'TEAM_ADD_MEMBERS',
      req.user?._id || null,
      `Added ${userIds.length} members to team: ${team.name}`,
      req
    );

    res.status(200).json(team);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const removeTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, userId } = req.params;

    const team = await Team.findById(id);
    if (!team) {
      res.status(404).json({ message: 'Team not found.' });
      return;
    }

    team.members = team.members.filter(m => m.toString() !== userId);
    await team.save();

    await logAudit(
      'TEAM_REMOVE_MEMBER',
      req.user?._id || null,
      `Removed member ${userId} from team: ${team.name}`,
      req
    );

    res.status(200).json(team);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
