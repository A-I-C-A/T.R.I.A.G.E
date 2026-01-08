import db from '../config/database';
import { TriageEngine, TriageInput, Priority } from './triageEngine';
import { differenceInMinutes } from 'date-fns';
import logger from '../utils/logger';

export interface PatientInput {
  hospitalId: number;
  patientId: string;
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  contact?: string;
  triageInput: TriageInput;
  preferredSpecialty?: string; // Nurse's selected specialty
  clinicalNotes?: string; // Nurse's clinical notes
}

export class PatientService {
  static async registerPatient(input: PatientInput) {
    const trx = await db.transaction();

    try {
      // Use AI-enhanced triage with deterioration prediction
      const triageResult = await TriageEngine.calculatePriorityWithAI({
        ...input.triageInput,
        age: input.age
      }, undefined, 0);

      // Use nurse's preferred specialty if provided, otherwise use auto-determined
      const finalSpecialty = input.preferredSpecialty || triageResult.recommendedSpecialty || 'General';

      const [patient] = await trx('patients')
        .insert({
          hospital_id: input.hospitalId,
          patient_id: input.patientId,
          name: input.name,
          age: input.age,
          gender: input.gender,
          contact: input.contact,
          priority: triageResult.priority,
          recommended_specialty: finalSpecialty,
          clinical_notes: input.clinicalNotes || null,
          status: 'waiting',
          arrival_time: new Date(),
          triage_time: new Date()
        })
        .returning('*');

      if (input.triageInput.vitalSigns) {
        await trx('vital_signs').insert({
          patient_id: patient.id,
          heart_rate: input.triageInput.vitalSigns.heartRate,
          respiratory_rate: input.triageInput.vitalSigns.respiratoryRate,
          systolic_bp: input.triageInput.vitalSigns.systolicBP,
          diastolic_bp: input.triageInput.vitalSigns.diastolicBP,
          temperature: input.triageInput.vitalSigns.temperature,
          oxygen_saturation: input.triageInput.vitalSigns.oxygenSaturation,
          consciousness: input.triageInput.vitalSigns.consciousness,
          recorded_at: new Date()
        });
      }

      if (input.triageInput.symptoms && input.triageInput.symptoms.length > 0) {
        await trx('symptoms').insert(
          input.triageInput.symptoms.map(s => ({
            patient_id: patient.id,
            symptom: s.symptom,
            severity: s.severity
          }))
        );
      }

      if (input.triageInput.riskFactors && input.triageInput.riskFactors.length > 0) {
        await trx('risk_factors').insert(
          input.triageInput.riskFactors.map(r => ({
            patient_id: patient.id,
            factor: r.factor,
            category: r.category
          }))
        );
      }

      await trx('triage_history').insert({
        patient_id: patient.id,
        new_priority: triageResult.priority,
        reason: triageResult.reasons.join('; '),
        auto_escalated: false,
        changed_at: new Date()
      });

      if (triageResult.priority === 'RED') {
        await trx('alerts').insert({
          hospital_id: input.hospitalId,
          patient_id: patient.id,
          type: 'escalation',
          severity: 'critical',
          message: `CRITICAL patient registered: ${triageResult.reasons.join(', ')}`,
          acknowledged: false
        });
      }

      // Save AI prediction to database if available
      if (triageResult.aiPrediction) {
        await trx('ai_predictions').insert({
          patient_id: patient.id,
          model_type: 'deterioration',
          risk_score: triageResult.aiPrediction.riskScore,
          deterioration_probability: triageResult.aiPrediction.deteriorationProbability,
          predicted_priority: triageResult.aiPrediction.predictedPriority,
          predicted_escalation_time: triageResult.aiPrediction.predictedEscalationTime 
            ? new Date(triageResult.aiPrediction.predictedEscalationTime)
            : null,
          confidence: triageResult.aiPrediction.confidence,
          reasoning: JSON.stringify(triageResult.aiPrediction.aiReasoning),
          shap_values: JSON.stringify(triageResult.aiPrediction.shapValues),
          model_version: 'rule-based-v1.0.0'
        });
      }

      await trx.commit();

      return {
        patient,
        triageResult
      };
    } catch (error) {
      await trx.rollback();
      logger.error('Error registering patient:', error);
      throw error;
    }
  }

  static async updateVitals(patientId: number, vitalSigns: TriageInput['vitalSigns']) {
    const trx = await db.transaction();

    try {
      const patient = await trx('patients').where({ id: patientId }).first();

      if (!patient) {
        throw new Error('Patient not found');
      }

      await trx('vital_signs').insert({
        patient_id: patientId,
        heart_rate: vitalSigns.heartRate,
        respiratory_rate: vitalSigns.respiratoryRate,
        systolic_bp: vitalSigns.systolicBP,
        diastolic_bp: vitalSigns.diastolicBP,
        temperature: vitalSigns.temperature,
        oxygen_saturation: vitalSigns.oxygenSaturation,
        consciousness: vitalSigns.consciousness,
        recorded_at: new Date()
      });

      const escalation = TriageEngine.shouldEscalate(
        patient.priority,
        patient.waiting_time_minutes,
        vitalSigns
      );

      if (escalation.shouldEscalate && escalation.newPriority) {
        await trx('patients')
          .where({ id: patientId })
          .update({
            priority: escalation.newPriority,
            escalated: true
          });

        await trx('triage_history').insert({
          patient_id: patientId,
          old_priority: patient.priority,
          new_priority: escalation.newPriority,
          reason: escalation.reason,
          auto_escalated: true,
          changed_at: new Date()
        });

        await trx('alerts').insert({
          hospital_id: patient.hospital_id,
          patient_id: patientId,
          type: 'escalation',
          severity: escalation.newPriority === 'RED' ? 'critical' : 'high',
          message: `Patient escalated from ${patient.priority} to ${escalation.newPriority}: ${escalation.reason}`,
          acknowledged: false
        });
      }

      await trx.commit();

      return escalation;
    } catch (error) {
      await trx.rollback();
      logger.error('Error updating vitals:', error);
      throw error;
    }
  }

  static async getQueue(hospitalId: number, statuses: string | string[] = 'waiting') {
    const statusArray = Array.isArray(statuses) ? statuses : [statuses];
    
    const patients = await db('patients')
      .where({ hospital_id: hospitalId })
      .whereIn('status', statusArray)
      .orderByRaw(`
        CASE priority
          WHEN 'RED' THEN 1
          WHEN 'YELLOW' THEN 2
          WHEN 'GREEN' THEN 3
          WHEN 'BLUE' THEN 4
        END
      `)
      .orderBy('arrival_time', 'asc')
      .select('*');

    const enrichedPatients = await Promise.all(
      patients.map(async (patient) => {
        const [latestVitals] = await db('vital_signs')
          .where({ patient_id: patient.id })
          .orderBy('recorded_at', 'desc')
          .limit(1);

        const symptoms = await db('symptoms')
          .where({ patient_id: patient.id })
          .select('symptom', 'severity');

        const waitingTime = differenceInMinutes(new Date(), new Date(patient.arrival_time));

        return {
          ...patient,
          waiting_time_minutes: waitingTime,
          latest_vitals: latestVitals,
          symptoms
        };
      })
    );

    return enrichedPatients;
  }

  static async updateStatus(
    patientId: number,
    status: 'waiting' | 'in_treatment' | 'discharged' | 'admitted' | 'referred'
  ) {
    const updates: any = { status };

    if (status === 'in_treatment') {
      updates.treatment_start_time = new Date();
    } else if (status === 'discharged' || status === 'admitted') {
      updates.discharge_time = new Date();
    }

    const [patient] = await db('patients')
      .where({ id: patientId })
      .update(updates)
      .returning('*');

    return patient;
  }

  static async checkEscalations(hospitalId: number) {
    const waitingPatients = await this.getQueue(hospitalId, 'waiting');
    const escalations = [];

    for (const patient of waitingPatients) {
      const escalation = TriageEngine.shouldEscalate(
        patient.priority,
        patient.waiting_time_minutes
      );

      if (escalation.shouldEscalate && escalation.newPriority) {
        await db.transaction(async (trx) => {
          await trx('patients')
            .where({ id: patient.id })
            .update({
              priority: escalation.newPriority,
              escalated: true
            });

          await trx('triage_history').insert({
            patient_id: patient.id,
            old_priority: patient.priority,
            new_priority: escalation.newPriority,
            reason: escalation.reason,
            auto_escalated: true,
            changed_at: new Date()
          });

          await trx('alerts').insert({
            hospital_id: hospitalId,
            patient_id: patient.id,
            type: 'critical_wait',
            severity: 'high',
            message: `Patient auto-escalated: ${escalation.reason}`,
            acknowledged: false
          });
        });

        escalations.push({
          patientId: patient.id,
          oldPriority: patient.priority,
          newPriority: escalation.newPriority,
          reason: escalation.reason
        });
      }
    }

    return escalations;
  }

  static async getPatientHistory(patientId: number) {
    const patient = await db('patients').where({ id: patientId }).first();
    
    if (!patient) {
      throw new Error('Patient not found');
    }

    const triageHistory = await db('triage_history')
      .where({ patient_id: patientId })
      .leftJoin('users', 'triage_history.triggered_by_user', 'users.id')
      .select(
        'triage_history.*',
        'users.name as triggered_by_name'
      )
      .orderBy('changed_at', 'desc');

    const vitalHistory = await db('vital_signs')
      .where({ patient_id: patientId })
      .orderBy('recorded_at', 'desc');

    const symptoms = await db('symptoms')
      .where({ patient_id: patientId })
      .select('*');

    const riskFactors = await db('risk_factors')
      .where({ patient_id: patientId })
      .select('*');

    const alerts = await db('alerts')
      .where({ patient_id: patientId })
      .orderBy('created_at', 'desc');

    return {
      patient,
      triageHistory,
      vitalHistory,
      symptoms,
      riskFactors,
      alerts
    };
  }

  static async updateDoctorNotes(patientId: number, doctorNotes: string) {
    const [patient] = await db('patients')
      .where({ id: patientId })
      .update({ doctor_notes: doctorNotes, updated_at: new Date() })
      .returning('*');

    return patient;
  }
}
