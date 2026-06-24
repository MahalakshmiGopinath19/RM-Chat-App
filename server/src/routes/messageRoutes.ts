import { Router, Response } from 'express';
import Message from '../models/Message';
import { authenticateJWT } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// Get replies for a thread parent message
router.get('/:messageId/replies', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const replies = await Message.find({ parentMessageId: messageId })
      .populate('sender', 'name email employeeId avatar')
      .populate('attachments')
      .sort({ createdAt: 1 });
    
    res.status(200).json(replies);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

export default router;
