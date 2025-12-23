import { Router } from 'express';
import { body, param } from 'express-validator';
import { PatientController } from '../controllers/patientController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';
import db from '../config/database';

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
  '/:patientId/assign',
  authenticate,
  authorize('doctor', 'admin'),
  [
    param('patientId').isNumeric(),
    body('doctorId').isNumeric(),
    validate
  ],
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { doctorId } = req.body;
      
      const [patient] = await db('patients')
        .where({ id: patientId })
        .update({
          doctor_id: doctorId,
          status: 'in_treatment',
          treatment_start_time: new Date()
        })
        .returning('*');
      
      res.json({ patient });
    } catch (error) {
      res.status(500).json({ error: 'Failed to assign doctor' });
    }
  }
);

router.post(
  '/check-escalations',
  authenticate,
  authorize('admin', 'staff'),
  PatientController.checkEscalations
);

export default router;
