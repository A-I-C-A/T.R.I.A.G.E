import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post(
  '/reports/generate',
  authenticate,
  authorize('admin', 'staff', 'government'),
  AnalyticsController.generateReport
);

router.get(
  '/reports',
  authenticate,
  AnalyticsController.getReports
);

router.get(
  '/government/dashboard',
  authenticate,
  authorize('government'),
  AnalyticsController.getGovernmentDashboard
);

router.get(
  '/crowd-surge',
  authenticate,
  authorize('government', 'admin'),
  AnalyticsController.getCrowdSurge
);

export default router;
