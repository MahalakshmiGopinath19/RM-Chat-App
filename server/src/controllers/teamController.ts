import { Response } from 'express';
import Team from '../models/Team';
import Chat from '../models/Chat';
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

    // Auto-create team chat room
    await Chat.create({ type: 'team', team: team._id });

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

export const updateTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, department, members } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      res.status(404).json({ message: 'Team not found.' });
      return;
    }

    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (department !== undefined) team.department = department || null;
    if (members !== undefined) team.members = members;

    await team.save();

    await logAudit(
      'TEAM_UPDATE',
      req.user?._id || null,
      `Admin updated team ID: ${id} (${team.name})`,
      req
    );

    res.status(200).json(team);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

export const deleteTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);
    if (!team) {
      res.status(404).json({ message: 'Team not found.' });
      return;
    }

    await Team.findByIdAndDelete(id);

    // Delete associated chat
    await Chat.findOneAndDelete({ type: 'team', team: id });

    await logAudit(
      'TEAM_DELETE',
      req.user?._id || null,
      `Admin deleted team: ${team.name}`,
      req
    );

    res.status(200).json({ message: 'Team deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
