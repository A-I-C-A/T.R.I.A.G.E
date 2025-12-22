import { Router } from 'express';
import { body, param } from 'express-validator';
import { PatientController } from '../controllers/patientController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('doctor', 'nurse', 'admin', 'staff'),
  [
    body('patientId').notEmpty(),
    body('triageInput').isObject(),
    body('triageInput.vitalSigns').isObject(),
    validate
  ],
  PatientController.register
);

router.get(
  '/queue',
  authenticate,
  PatientController.getQueue
);

router.put(
  '/:patientId/vitals',
  authenticate,
  authorize('doctor', 'nurse', 'admin'),
  [
    param('patientId').isNumeric(),
    body('vitalSigns').isObject(),
    validate
  ],
  PatientController.updateVitals
);

router.put(
  '/:patientId/status',
  authenticate,
  authorize('doctor', 'nurse', 'admin'),
  [
    param('patientId').isNumeric(),
    body('status').isIn(['waiting', 'in_treatment', 'discharged', 'admitted', 'referred']),
    validate
  ],
  PatientController.updateStatus
);

router.post(
  '/check-escalations',
  authenticate,
  authorize('admin', 'staff'),
  PatientController.checkEscalations
);

export default router;
