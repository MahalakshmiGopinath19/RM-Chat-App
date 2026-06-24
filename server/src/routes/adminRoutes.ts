import { Router } from 'express';
import {
  getAuditLogs,
  getSystemStats,
  exportReportExcel,
  exportReportPDF
} from '../controllers/adminController';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.use(requireAdmin);

router.get('/audit-logs', getAuditLogs);
router.get('/stats', getSystemStats);
router.get('/report/excel', exportReportExcel);
router.get('/report/pdf', exportReportPDF);

export default router;
