import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PatientService } from '../services/patientService';
import { websocketHandler } from '../websocket/handler';
import logger from '../utils/logger';
import db from '../config/database';

export class PatientController {
  static async register(req: AuthRequest, res: Response) {
    try {
      const { patientId, name, age, gender, contact, triageInput } = req.body;
      const hospitalId = req.user?.hospitalId;

      logger.info('Patient registration attempt:', { patientId, hospitalId, hasUser: !!req.user });

      if (!hospitalId) {
        return res.status(400).json({ error: 'Hospital ID required' });
      }

      const result = await PatientService.registerPatient({
        hospitalId,
        patientId,
        name,
        age,
        gender,
        contact,
        triageInput
      });

      websocketHandler.emitPatientRegistered(hospitalId, {
        patient: result.patient,
        triage: result.triageResult
      });

      const queue = await PatientService.getQueue(hospitalId);
      websocketHandler.emitQueueUpdate(hospitalId, queue);

      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Patient registration error:', { 
        error: error.message, 
        stack: error.stack,
        body: req.body 
      });
      res.status(500).json({ error: error.message || 'Failed to register patient' });
    }
  }

  static async getQueue(req: AuthRequest, res: Response) {
    try {
      const hospitalId = req.user?.hospitalId || Number(req.query.hospitalId);

      if (!hospitalId) {
        return res.status(400).json({ error: 'Hospital ID required' });
      }

      const status = (req.query.status as string) || 'waiting';
      const statuses = status.split(',').map(s => s.trim());
      const queue = await PatientService.getQueue(hospitalId, statuses);

      res.json(queue);
    } catch (error) {
      logger.error('Get queue error:', error);
      res.status(500).json({ error: 'Failed to get queue' });
    }
  }

  static async updateVitals(req: AuthRequest, res: Response) {
    try {
      const { patientId } = req.params;
      const { vitalSigns } = req.body;

      const result = await PatientService.updateVitals(Number(patientId), vitalSigns);

      if (result.shouldEscalate) {
        const patient = await db('patients').where({ id: patientId }).first();
        
        websocketHandler.emitPatientEscalated(patient.hospital_id, {
          patientId: patient.id,
          oldPriority: patient.priority,
          newPriority: result.newPriority,
          reason: result.reason
        });

        const queue = await PatientService.getQueue(patient.hospital_id);
        websocketHandler.emitQueueUpdate(patient.hospital_id, queue);
      }

      res.json(result);
    } catch (error) {
      logger.error('Update vitals error:', error);
      res.status(500).json({ error: 'Failed to update vitals' });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { patientId } = req.params;
      const { status } = req.body;

      const patient = await PatientService.updateStatus(Number(patientId), status);

      websocketHandler.emitStatusUpdate(patient.hospital_id, {
        patientId: patient.id,
        status: patient.status
      });

      const queue = await PatientService.getQueue(patient.hospital_id);
      websocketHandler.emitQueueUpdate(patient.hospital_id, queue);

      res.json(patient);
    } catch (error) {
      logger.error('Update status error:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  }

  static async checkEscalations(req: AuthRequest, res: Response) {
    try {
      const hospitalId = req.user?.hospitalId || Number(req.query.hospitalId);

      if (!hospitalId) {
        return res.status(400).json({ error: 'Hospital ID required' });
      }

      const escalations = await PatientService.checkEscalations(hospitalId);

      if (escalations.length > 0) {
        escalations.forEach(esc => {
          websocketHandler.emitPatientEscalated(hospitalId, esc);
        });

        const queue = await PatientService.getQueue(hospitalId);
        websocketHandler.emitQueueUpdate(hospitalId, queue);
      }

      res.json({ escalations, count: escalations.length });
    } catch (error) {
      logger.error('Check escalations error:', error);
      res.status(500).json({ error: 'Failed to check escalations' });
    }
  }
}
