import { Router } from 'express';
import {
  getChats,
  getChatMessages,
  createDirectChat,
  createGroupChat,
  togglePinChat,
  toggleStarChat
} from '../controllers/chatController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', getChats);
router.get('/:chatId/messages', getChatMessages);
router.post('/direct', createDirectChat);
router.post('/group', createGroupChat);
router.post('/:chatId/pin', togglePinChat);
router.post('/:chatId/star', toggleStarChat);

export default router;
