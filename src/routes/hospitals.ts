import { Router } from 'express';
import { body, param } from 'express-validator';
import { HospitalController } from '../controllers/hospitalController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

router.get(
  '/',
  authenticate,
  HospitalController.listHospitals
);

router.post(
  '/',
  authenticate,
  authorize('admin', 'government'),
  [
    body('name').notEmpty(),
    body('location').notEmpty(),
    body('totalBeds').isNumeric(),
    body('icuBeds').isNumeric(),
    validate
  ],
  HospitalController.createHospital
);

router.get(
  '/:hospitalId/stats',
  authenticate,
  HospitalController.getStats
);

router.put(
  '/:hospitalId/beds',
  authenticate,
  authorize('admin', 'staff'),
  [
    body('availableBeds').isNumeric(),
    validate
  ],
  HospitalController.updateBeds
);

router.put(
  '/:hospitalId/staff',
  authenticate,
  authorize('admin', 'staff'),
  [
    body('role').isIn(['doctor', 'nurse', 'specialist', 'support']),
    body('availableCount').isNumeric(),
    body('totalCount').isNumeric(),
    validate
  ],
  HospitalController.updateStaff
);

router.get(
  '/:hospitalId/overload',
  authenticate,
  HospitalController.checkOverload
);

router.get(
  '/:hospitalId/alerts',
  authenticate,
  HospitalController.getAlerts
);

router.put(
  '/alerts/:alertId/acknowledge',
  authenticate,
  authorize('admin', 'doctor', 'nurse', 'staff'),
  HospitalController.acknowledgeAlert
);

export default router;
