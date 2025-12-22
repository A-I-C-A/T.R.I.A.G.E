import db from '../config/database';
import logger from '../utils/logger';

export interface HospitalStats {
  totalBeds: number;
  availableBeds: number;
  icuBeds: number;
  availableIcuBeds: number;
  currentLoad: number;
  waitingPatients: number;
  inTreatment: number;
  criticalCases: number;
  urgentCases: number;
  staffAvailability: any[];
}

export class HospitalService {
  static async getHospitalStats(hospitalId: number): Promise<HospitalStats> {
    const hospital = await db('hospitals').where({ id: hospitalId }).first();

    if (!hospital) {
      throw new Error('Hospital not found');
    }

    const patientCounts = await db('patients')
      .where({ hospital_id: hospitalId })
      .whereIn('status', ['waiting', 'in_treatment'])
      .select('status', 'priority')
      .count('* as count')
      .groupBy('status', 'priority');

    const waitingPatients = patientCounts
      .filter(p => p.status === 'waiting')
      .reduce((sum, p) => sum + Number(p.count), 0);

    const inTreatment = patientCounts
      .filter(p => p.status === 'in_treatment')
      .reduce((sum, p) => sum + Number(p.count), 0);

    const criticalCases = patientCounts
      .filter(p => p.priority === 'RED')
      .reduce((sum, p) => sum + Number(p.count), 0);

    const urgentCases = patientCounts
      .filter(p => p.priority === 'YELLOW')
      .reduce((sum, p) => sum + Number(p.count), 0);

    const staffAvailability = await db('staff_availability')
      .where({ hospital_id: hospitalId })
      .select('*');

    const currentLoad = waitingPatients + inTreatment;

    return {
      totalBeds: hospital.total_beds,
      availableBeds: hospital.available_beds,
      icuBeds: hospital.icu_beds,
      availableIcuBeds: hospital.available_icu_beds,
      currentLoad,
      waitingPatients,
      inTreatment,
      criticalCases,
      urgentCases,
      staffAvailability
    };
  }

  static async updateBedAvailability(
    hospitalId: number,
    availableBeds: number,
    availableIcuBeds?: number
  ) {
    const updates: any = { available_beds: availableBeds };

    if (availableIcuBeds !== undefined) {
      updates.available_icu_beds = availableIcuBeds;
    }

    const [hospital] = await db('hospitals')
      .where({ id: hospitalId })
      .update(updates)
      .returning('*');

    if (availableBeds < 5) {
      await db('alerts').insert({
        hospital_id: hospitalId,
        type: 'bed_shortage',
        severity: availableBeds === 0 ? 'critical' : 'high',
        message: `Low bed availability: ${availableBeds} beds remaining`,
        acknowledged: false
      });
    }

    return hospital;
  }

  static async updateStaffAvailability(
    hospitalId: number,
    role: 'doctor' | 'nurse' | 'specialist' | 'support',
    availableCount: number,
    totalCount: number
  ) {
    const existing = await db('staff_availability')
      .where({ hospital_id: hospitalId, role })
      .first();

    if (existing) {
      await db('staff_availability')
        .where({ hospital_id: hospitalId, role })
        .update({
          available_count: availableCount,
          total_count: totalCount,
          updated_at: new Date()
        });
    } else {
      await db('staff_availability').insert({
        hospital_id: hospitalId,
        role,
        available_count: availableCount,
        total_count: totalCount,
        updated_at: new Date()
      });
    }

    const availabilityRate = totalCount > 0 ? (availableCount / totalCount) * 100 : 0;

    if (availabilityRate < 30) {
      await db('alerts').insert({
        hospital_id: hospitalId,
        type: 'staff_shortage',
        severity: availabilityRate < 15 ? 'critical' : 'high',
        message: `Low ${role} availability: ${availableCount}/${totalCount} (${availabilityRate.toFixed(1)}%)`,
        acknowledged: false
      });
    }

    return { role, availableCount, totalCount, availabilityRate };
  }

  static async checkOverload(hospitalId: number) {
    const stats = await this.getHospitalStats(hospitalId);

    const bedUtilization = stats.totalBeds > 0
      ? ((stats.totalBeds - stats.availableBeds) / stats.totalBeds) * 100
      : 0;

    const isOverloaded = bedUtilization > 90 || stats.criticalCases > 10 || stats.waitingPatients > 50;

    if (isOverloaded) {
      const existingAlert = await db('alerts')
        .where({
          hospital_id: hospitalId,
          type: 'overload',
          acknowledged: false
        })
        .first();

      if (!existingAlert) {
        await db('alerts').insert({
          hospital_id: hospitalId,
          type: 'overload',
          severity: 'critical',
          message: `Hospital overload: ${bedUtilization.toFixed(1)}% bed utilization, ${stats.criticalCases} critical cases, ${stats.waitingPatients} waiting`,
          acknowledged: false
        });
      }
    }

    return {
      isOverloaded,
      bedUtilization,
      stats
    };
  }

  static async getAlerts(hospitalId: number, acknowledged: boolean = false) {
    return db('alerts')
      .where({ hospital_id: hospitalId, acknowledged })
      .orderBy('created_at', 'desc')
      .select('*');
  }

  static async acknowledgeAlert(alertId: number, userId: number) {
    const [alert] = await db('alerts')
      .where({ id: alertId })
      .update({
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date()
      })
      .returning('*');

    return alert;
  }
}
