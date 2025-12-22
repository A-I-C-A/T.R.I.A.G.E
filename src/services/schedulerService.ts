import cron from 'node-cron';
import db from '../config/database';
import { PatientService } from '../services/patientService';
import { HospitalService } from '../services/hospitalService';
import { AnalyticsService } from '../services/analyticsService';
import { websocketHandler } from '../websocket/handler';
import logger from '../utils/logger';
import { differenceInMinutes } from 'date-fns';

export class SchedulerService {
  static startScheduledJobs() {
    cron.schedule('*/5 * * * *', async () => {
      await this.checkAllEscalations();
    });

    cron.schedule('*/10 * * * *', async () => {
      await this.updateWaitingTimes();
    });

    cron.schedule('*/15 * * * *', async () => {
      await this.checkHospitalOverloads();
    });

    cron.schedule('0 1 * * *', async () => {
      await this.generateDailyReports();
    });

    cron.schedule('*/5 * * * *', async () => {
      await this.monitorCrowdSurge();
    });

    logger.info('Scheduled jobs started');
  }

  private static async checkAllEscalations() {
    try {
      const hospitals = await db('hospitals').where({ is_active: true }).select('id');

      for (const hospital of hospitals) {
        const escalations = await PatientService.checkEscalations(hospital.id);

        if (escalations.length > 0) {
          const queue = await PatientService.getQueue(hospital.id);
          websocketHandler.emitQueueUpdate(hospital.id, queue);

          logger.info(`Auto-escalated ${escalations.length} patients in hospital ${hospital.id}`);
        }
      }
    } catch (error) {
      logger.error('Error checking escalations:', error);
    }
  }

  private static async updateWaitingTimes() {
    try {
      const waitingPatients = await db('patients')
        .whereIn('status', ['waiting', 'in_treatment'])
        .select('*');

      for (const patient of waitingPatients) {
        const waitingTime = differenceInMinutes(new Date(), new Date(patient.arrival_time));

        await db('patients')
          .where({ id: patient.id })
          .update({ waiting_time_minutes: waitingTime });
      }
    } catch (error) {
      logger.error('Error updating waiting times:', error);
    }
  }

  private static async checkHospitalOverloads() {
    try {
      const hospitals = await db('hospitals').where({ is_active: true }).select('id');

      for (const hospital of hospitals) {
        const result = await HospitalService.checkOverload(hospital.id);

        if (result.isOverloaded) {
          websocketHandler.emitAlert(hospital.id, {
            type: 'overload',
            severity: 'critical',
            message: 'Hospital experiencing high load',
            stats: result.stats
          });
        }

        const stats = await HospitalService.getHospitalStats(hospital.id);
        websocketHandler.emitHospitalStats(hospital.id, stats);
      }
    } catch (error) {
      logger.error('Error checking hospital overloads:', error);
    }
  }

  private static async generateDailyReports() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const hospitals = await db('hospitals').where({ is_active: true }).select('id');

      for (const hospital of hospitals) {
        await AnalyticsService.generateDailyReport(hospital.id, yesterday);
        logger.info(`Generated daily report for hospital ${hospital.id}`);
      }
    } catch (error) {
      logger.error('Error generating daily reports:', error);
    }
  }

  private static async monitorCrowdSurge() {
    try {
      const surgeData = await AnalyticsService.getCrowdSurgeMonitoring();

      if (surgeData.totalSurges > 0) {
        websocketHandler.emitCrowdSurge(surgeData);
        logger.warn(`Crowd surge detected at ${surgeData.totalSurges} hospitals`);
      }
    } catch (error) {
      logger.error('Error monitoring crowd surge:', error);
    }
  }
}
