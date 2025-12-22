import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AnalyticsService } from '../services/analyticsService';
import logger from '../utils/logger';

export class AnalyticsController {
  static async generateReport(req: AuthRequest, res: Response) {
    try {
      const hospitalId = req.user?.hospitalId || Number(req.params.hospitalId);
      const date = req.body.date ? new Date(req.body.date) : new Date();

      if (!hospitalId) {
        return res.status(400).json({ error: 'Hospital ID required' });
      }

      const report = await AnalyticsService.generateDailyReport(hospitalId, date);
      res.json(report);
    } catch (error) {
      logger.error('Generate report error:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }

  static async getReports(req: AuthRequest, res: Response) {
    try {
      const hospitalId = req.user?.hospitalId || Number(req.query.hospitalId);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      if (!hospitalId) {
        return res.status(400).json({ error: 'Hospital ID required' });
      }

      const reports = await AnalyticsService.getReports(hospitalId, startDate, endDate);
      res.json(reports);
    } catch (error) {
      logger.error('Get reports error:', error);
      res.status(500).json({ error: 'Failed to get reports' });
    }
  }

  static async getGovernmentDashboard(req: AuthRequest, res: Response) {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const dashboard = await AnalyticsService.getGovernmentDashboard(startDate, endDate);
      res.json(dashboard);
    } catch (error) {
      logger.error('Get government dashboard error:', error);
      res.status(500).json({ error: 'Failed to get government dashboard' });
    }
  }

  static async getCrowdSurge(req: AuthRequest, res: Response) {
    try {
      const surgeData = await AnalyticsService.getCrowdSurgeMonitoring();
      res.json(surgeData);
    } catch (error) {
      logger.error('Get crowd surge error:', error);
      res.status(500).json({ error: 'Failed to get crowd surge data' });
    }
  }
}
