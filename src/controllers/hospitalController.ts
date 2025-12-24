import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { HospitalService } from '../services/hospitalService';
import { websocketHandler } from '../websocket/handler';
import logger from '../utils/logger';
import db from '../config/database';

export class HospitalController {
  static async getStats(req: AuthRequest, res: Response) {
    try {
      const hospitalId = req.user?.hospitalId || Number(req.params.hospitalId);

      if (!hospitalId) {
        return res.status(400).json({ error: 'Hospital ID required' });
      }

      const stats = await HospitalService.getHospitalStats(hospitalId);
      res.json(stats);
    } catch (error) {
      logger.error('Get hospital stats error:', error);
      res.status(500).json({ error: 'Failed to get hospital stats' });
    }
  }

  static async updateBeds(req: AuthRequest, res: Response) {
    try {
      const hospitalId = req.user?.hospitalId || Number(req.params.hospitalId);
      const { availableBeds, availableIcuBeds } = req.body;

      if (!hospitalId) {
        return res.status(400).json({ error: 'Hospital ID required' });
      }

      const hospital = await HospitalService.updateBedAvailability(
        hospitalId,
        availableBeds,
        availableIcuBeds
      );

      const stats = await HospitalService.getHospitalStats(hospitalId);
      websocketHandler.emitHospitalStats(hospitalId, stats);

      res.json(hospital);
    } catch (error) {
      logger.error('Update beds error:', error);
      res.status(500).json({ error: 'Failed to update bed availability' });
    }
  }

  static async updateStaff(req: AuthRequest, res: Response) {
    try {
      const hospitalId = req.user?.hospitalId || Number(req.params.hospitalId);
      const { role, availableCount, totalCount } = req.body;

      if (!hospitalId) {
        return res.status(400).json({ error: 'Hospital ID required' });
      }

      const result = await HospitalService.updateStaffAvailability(
        hospitalId,
        role,
        availableCount,
        totalCount
      );

      const stats = await HospitalService.getHospitalStats(hospitalId);
      websocketHandler.emitHospitalStats(hospitalId, stats);

      res.json(result);
    } catch (error) {
      logger.error('Update staff error:', error);
      res.status(500).json({ error: 'Failed to update staff availability' });
    }
  }

  static async checkOverload(req: AuthRequest, res: Response) {
    try {
      const hospitalId = req.user?.hospitalId || Number(req.params.hospitalId);

      if (!hospitalId) {
        return res.status(400).json({ error: 'Hospital ID required' });
      }

      const result = await HospitalService.checkOverload(hospitalId);

      if (result.isOverloaded) {
        websocketHandler.emitAlert(hospitalId, {
          type: 'overload',
          severity: 'critical',
          message: 'Hospital overload detected',
          stats: result.stats
        });
      }

      res.json(result);
    } catch (error) {
      logger.error('Check overload error:', error);
      res.status(500).json({ error: 'Failed to check overload' });
    }
  }

  static async getAlerts(req: AuthRequest, res: Response) {
    try {
      const hospitalId = req.user?.hospitalId || Number(req.params.hospitalId);
      const acknowledged = req.query.acknowledged === 'true';

      if (!hospitalId) {
        return res.status(400).json({ error: 'Hospital ID required' });
      }

      const alerts = await HospitalService.getAlerts(hospitalId, acknowledged);
      res.json(alerts);
    } catch (error) {
      logger.error('Get alerts error:', error);
      res.status(500).json({ error: 'Failed to get alerts' });
    }
  }

  static async acknowledgeAlert(req: AuthRequest, res: Response) {
    try {
      const { alertId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const alert = await HospitalService.acknowledgeAlert(Number(alertId), userId);
      res.json(alert);
    } catch (error) {
      logger.error('Acknowledge alert error:', error);
      res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
  }

  static async listHospitals(req: AuthRequest, res: Response) {
    try {
      const hospitals = await db('hospitals')
        .where({ is_active: true })
        .select('id', 'name', 'location', 'contact', 'total_beds', 'available_beds', 'icu_beds', 'available_icu_beds');

      res.json(hospitals);
    } catch (error) {
      logger.error('List hospitals error:', error);
      res.status(500).json({ error: 'Failed to list hospitals' });
    }
  }

  static async createHospital(req: AuthRequest, res: Response) {
    try {
      const { name, location, contact, totalBeds, icuBeds } = req.body;

      const [hospital] = await db('hospitals')
        .insert({
          name,
          location,
          contact,
          total_beds: totalBeds,
          available_beds: totalBeds,
          icu_beds: icuBeds,
          available_icu_beds: icuBeds,
          is_active: true
        })
        .returning('*');

      res.status(201).json(hospital);
    } catch (error) {
      logger.error('Create hospital error:', error);
      res.status(500).json({ error: 'Failed to create hospital' });
    }
  }

  static async getPatientHistory(req: AuthRequest, res: Response) {
    try {
      const hospitalId = req.user?.hospitalId || Number(req.params.hospitalId);

      if (!hospitalId) {
        return res.status(400).json({ error: 'Hospital ID required' });
      }

      // Get patient arrival history for last 7 days (for surge forecasting)
      // Compatible with both PostgreSQL and SQLite
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const history = await db('patients')
        .where({ hospital_id: hospitalId })
        .where('arrival_time', '>=', sevenDaysAgo.toISOString())
        .select('arrival_time')
        .orderBy('arrival_time', 'asc');

      // Group by hour in application code (cross-database compatible)
      const grouped: { [key: string]: number } = {};
      history.forEach((row: any) => {
        const timestamp = new Date(row.arrival_time);
        timestamp.setMinutes(0, 0, 0);
        const hourKey = timestamp.toISOString();
        grouped[hourKey] = (grouped[hourKey] || 0) + 1;
      });

      const result = Object.entries(grouped).map(([timestamp, patient_count]) => ({
        timestamp,
        patient_count
      }));

      res.json({ data: result });
    } catch (error) {
      logger.error('Get patient history error:', error);
      res.status(500).json({ error: 'Failed to get patient history' });
    }
  }
}
