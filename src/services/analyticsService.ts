import db from '../config/database';
import { format, startOfDay, endOfDay } from 'date-fns';

export class AnalyticsService {
  static async generateDailyReport(hospitalId: number, date: Date) {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    const patients = await db('patients')
      .where({ hospital_id: hospitalId })
      .whereBetween('arrival_time', [startDate, endDate])
      .select('*');

    const totalPatients = patients.length;

    const priorityCounts = {
      RED: patients.filter(p => p.priority === 'RED').length,
      YELLOW: patients.filter(p => p.priority === 'YELLOW').length,
      GREEN: patients.filter(p => p.priority === 'GREEN').length,
      BLUE: patients.filter(p => p.priority === 'BLUE').length
    };

    const waitTimes = patients
      .filter(p => p.treatment_start_time)
      .map(p => {
        const arrival = new Date(p.arrival_time);
        const treatment = new Date(p.treatment_start_time);
        return Math.floor((treatment.getTime() - arrival.getTime()) / 60000);
      });

    const averageWaitTime = waitTimes.length > 0
      ? Math.floor(waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length)
      : 0;

    const maxWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;

    const escalations = await db('triage_history')
      .whereIn('patient_id', patients.map(p => p.id))
      .where({ auto_escalated: true })
      .count('* as count')
      .first();

    const escalationCount = Number(escalations?.count || 0);

    const hourlyStats = await this.getHourlyStats(hospitalId, startDate, endDate);

    const peakHour = hourlyStats.reduce((max, hour) => 
      hour.patient_count > max.patient_count ? hour : max
    , { hour: 0, patient_count: 0, timestamp: new Date() });

    const reportData = {
      hospital_id: hospitalId,
      incident_date: format(date, 'yyyy-MM-dd'),
      total_patients: totalPatients,
      red_priority_count: priorityCounts.RED,
      yellow_priority_count: priorityCounts.YELLOW,
      green_priority_count: priorityCounts.GREEN,
      average_wait_time_minutes: averageWaitTime,
      max_wait_time_minutes: maxWaitTime,
      escalation_count: escalationCount,
      peak_load: peakHour.patient_count,
      peak_time: peakHour.timestamp,
      hourly_stats: JSON.stringify(hourlyStats)
    };

    const existing = await db('incident_reports')
      .where({ hospital_id: hospitalId, incident_date: format(date, 'yyyy-MM-dd') })
      .first();

    if (existing) {
      await db('incident_reports')
        .where({ id: existing.id })
        .update(reportData);
    } else {
      await db('incident_reports').insert(reportData);
    }

    return reportData;
  }

  private static async getHourlyStats(hospitalId: number, startDate: Date, endDate: Date) {
    const patients = await db('patients')
      .where({ hospital_id: hospitalId })
      .whereBetween('arrival_time', [startDate, endDate])
      .select('arrival_time', 'priority');

    const hourlyMap = new Map<number, any>();

    for (let hour = 0; hour < 24; hour++) {
      hourlyMap.set(hour, {
        hour,
        patient_count: 0,
        red_count: 0,
        yellow_count: 0,
        green_count: 0,
        blue_count: 0,
        timestamp: new Date(startDate.getTime() + hour * 3600000)
      });
    }

    patients.forEach(patient => {
      const hour = new Date(patient.arrival_time).getHours();
      const stats = hourlyMap.get(hour)!;
      stats.patient_count++;
      
      switch (patient.priority) {
        case 'RED': stats.red_count++; break;
        case 'YELLOW': stats.yellow_count++; break;
        case 'GREEN': stats.green_count++; break;
        case 'BLUE': stats.blue_count++; break;
      }
    });

    return Array.from(hourlyMap.values());
  }

  static async getReports(hospitalId: number, startDate?: Date, endDate?: Date) {
    let query = db('incident_reports').where({ hospital_id: hospitalId });

    if (startDate) {
      query = query.where('incident_date', '>=', format(startDate, 'yyyy-MM-dd'));
    }

    if (endDate) {
      query = query.where('incident_date', '<=', format(endDate, 'yyyy-MM-dd'));
    }

    return query.orderBy('incident_date', 'desc').select('*');
  }

  static async getGovernmentDashboard(startDate?: Date, endDate?: Date) {
    let query = db('incident_reports').select(
      db.raw('SUM(total_patients) as total_patients'),
      db.raw('SUM(red_priority_count) as total_red'),
      db.raw('SUM(yellow_priority_count) as total_yellow'),
      db.raw('SUM(escalation_count) as total_escalations'),
      db.raw('AVG(average_wait_time_minutes) as avg_wait_time'),
      db.raw('MAX(max_wait_time_minutes) as max_wait_time'),
      db.raw('MAX(peak_load) as max_peak_load')
    );

    if (startDate) {
      query = query.where('incident_date', '>=', format(startDate, 'yyyy-MM-dd'));
    }

    if (endDate) {
      query = query.where('incident_date', '<=', format(endDate, 'yyyy-MM-dd'));
    }

    const overall = await query.first();

    const byHospital = await db('incident_reports')
      .join('hospitals', 'incident_reports.hospital_id', 'hospitals.id')
      .select(
        'hospitals.id',
        'hospitals.name',
        'hospitals.location',
        db.raw('SUM(total_patients) as total_patients'),
        db.raw('AVG(average_wait_time_minutes) as avg_wait_time'),
        db.raw('SUM(escalation_count) as escalations'),
        db.raw('MAX(peak_load) as peak_load')
      )
      .modify((qb) => {
        if (startDate) {
          qb.where('incident_date', '>=', format(startDate, 'yyyy-MM-dd'));
        }
        if (endDate) {
          qb.where('incident_date', '<=', format(endDate, 'yyyy-MM-dd'));
        }
      })
      .groupBy('hospitals.id', 'hospitals.name', 'hospitals.location')
      .orderBy('total_patients', 'desc');

    const activeAlerts = await db('alerts')
      .join('hospitals', 'alerts.hospital_id', 'hospitals.id')
      .where({ 'alerts.acknowledged': false })
      .select(
        'alerts.*',
        'hospitals.name as hospital_name',
        'hospitals.location as hospital_location'
      )
      .orderBy('alerts.created_at', 'desc')
      .limit(50);

    return {
      overall,
      byHospital,
      activeAlerts
    };
  }

  static async getCrowdSurgeMonitoring() {
    const currentLoad = await db('hospitals')
      .select(
        'hospitals.id',
        'hospitals.name',
        'hospitals.location',
        'hospitals.available_beds',
        'hospitals.total_beds'
      )
      .select(db.raw(`
        (SELECT COUNT(*) FROM patients 
         WHERE patients.hospital_id = hospitals.id 
         AND patients.status IN ('waiting', 'in_treatment')) as current_patients
      `))
      .select(db.raw(`
        (SELECT COUNT(*) FROM patients 
         WHERE patients.hospital_id = hospitals.id 
         AND patients.status = 'waiting'
         AND patients.priority = 'RED') as critical_waiting
      `));

    const surgeHospitals = currentLoad.filter(h => {
      const utilization = h.total_beds > 0 
        ? ((h.total_beds - h.available_beds) / h.total_beds) * 100 
        : 0;
      return utilization > 80 || h.critical_waiting > 5 || h.current_patients > 30;
    });

    return {
      allHospitals: currentLoad,
      surgeHospitals,
      totalSurges: surgeHospitals.length
    };
  }
}
