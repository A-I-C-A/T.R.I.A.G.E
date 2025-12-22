export interface VitalSigns {
  heartRate?: number;
  respiratoryRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  temperature?: number;
  oxygenSaturation?: number;
  consciousness?: 'alert' | 'verbal' | 'pain' | 'unresponsive';
}

export interface Symptom {
  symptom: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
}

export interface RiskFactor {
  factor: string;
  category: string;
}

export interface TriageInput {
  vitalSigns: VitalSigns;
  symptoms: Symptom[];
  riskFactors: RiskFactor[];
  age?: number;
  chiefComplaint?: string;
}

export type Priority = 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';

export interface TriageResult {
  priority: Priority;
  score: number;
  reasons: string[];
  recommendedActions: string[];
}

export class TriageEngine {
  private static readonly CRITICAL_THRESHOLD = 80;
  private static readonly HIGH_THRESHOLD = 50;
  private static readonly MODERATE_THRESHOLD = 20;

  public static calculatePriority(input: TriageInput): TriageResult {
    let score = 0;
    const reasons: string[] = [];
    const recommendedActions: string[] = [];

    const vitalScore = this.evaluateVitalSigns(input.vitalSigns, reasons);
    const symptomScore = this.evaluateSymptoms(input.symptoms, reasons);
    const riskScore = this.evaluateRiskFactors(input.riskFactors, input.age, reasons);

    score = vitalScore + symptomScore + riskScore;

    let priority: Priority;
    if (score >= this.CRITICAL_THRESHOLD) {
      priority = 'RED';
      recommendedActions.push('IMMEDIATE medical intervention required');
      recommendedActions.push('Prepare resuscitation equipment');
      recommendedActions.push('Alert senior physician');
    } else if (score >= this.HIGH_THRESHOLD) {
      priority = 'YELLOW';
      recommendedActions.push('Urgent care needed within 30 minutes');
      recommendedActions.push('Continuous monitoring');
    } else if (score >= this.MODERATE_THRESHOLD) {
      priority = 'GREEN';
      recommendedActions.push('Standard care - within 2 hours');
      recommendedActions.push('Regular vital checks');
    } else {
      priority = 'BLUE';
      recommendedActions.push('Minor condition - can wait');
      recommendedActions.push('Self-care advice applicable');
    }

    return { priority, score, reasons, recommendedActions };
  }

  private static evaluateVitalSigns(vitals: VitalSigns, reasons: string[]): number {
    let score = 0;

    if (vitals.heartRate !== undefined) {
      if (vitals.heartRate < 40 || vitals.heartRate > 140) {
        score += 30;
        reasons.push(`Critical heart rate: ${vitals.heartRate} bpm`);
      } else if (vitals.heartRate < 50 || vitals.heartRate > 120) {
        score += 20;
        reasons.push(`Abnormal heart rate: ${vitals.heartRate} bpm`);
      } else if (vitals.heartRate < 60 || vitals.heartRate > 100) {
        score += 10;
        reasons.push(`Elevated heart rate: ${vitals.heartRate} bpm`);
      }
    }

    if (vitals.respiratoryRate !== undefined) {
      if (vitals.respiratoryRate < 8 || vitals.respiratoryRate > 30) {
        score += 30;
        reasons.push(`Critical respiratory rate: ${vitals.respiratoryRate}/min`);
      } else if (vitals.respiratoryRate < 10 || vitals.respiratoryRate > 24) {
        score += 20;
        reasons.push(`Abnormal respiratory rate: ${vitals.respiratoryRate}/min`);
      } else if (vitals.respiratoryRate < 12 || vitals.respiratoryRate > 20) {
        score += 10;
        reasons.push(`Elevated respiratory rate: ${vitals.respiratoryRate}/min`);
      }
    }

    if (vitals.systolicBP !== undefined) {
      if (vitals.systolicBP < 90 || vitals.systolicBP > 200) {
        score += 30;
        reasons.push(`Critical blood pressure: ${vitals.systolicBP}/${vitals.diastolicBP} mmHg`);
      } else if (vitals.systolicBP < 100 || vitals.systolicBP > 180) {
        score += 20;
        reasons.push(`Abnormal blood pressure: ${vitals.systolicBP}/${vitals.diastolicBP} mmHg`);
      } else if (vitals.systolicBP > 140) {
        score += 10;
        reasons.push(`Elevated blood pressure: ${vitals.systolicBP}/${vitals.diastolicBP} mmHg`);
      }
    }

    if (vitals.oxygenSaturation !== undefined) {
      if (vitals.oxygenSaturation < 90) {
        score += 30;
        reasons.push(`Critical oxygen saturation: ${vitals.oxygenSaturation}%`);
      } else if (vitals.oxygenSaturation < 94) {
        score += 20;
        reasons.push(`Low oxygen saturation: ${vitals.oxygenSaturation}%`);
      } else if (vitals.oxygenSaturation < 96) {
        score += 10;
        reasons.push(`Reduced oxygen saturation: ${vitals.oxygenSaturation}%`);
      }
    }

    if (vitals.temperature !== undefined) {
      if (vitals.temperature < 35 || vitals.temperature > 40) {
        score += 25;
        reasons.push(`Critical temperature: ${vitals.temperature}°C`);
      } else if (vitals.temperature < 36 || vitals.temperature > 39) {
        score += 15;
        reasons.push(`Abnormal temperature: ${vitals.temperature}°C`);
      } else if (vitals.temperature > 38) {
        score += 8;
        reasons.push(`Fever: ${vitals.temperature}°C`);
      }
    }

    if (vitals.consciousness) {
      switch (vitals.consciousness) {
        case 'unresponsive':
          score += 40;
          reasons.push('Patient unresponsive - CRITICAL');
          break;
        case 'pain':
          score += 25;
          reasons.push('Responds only to pain');
          break;
        case 'verbal':
          score += 15;
          reasons.push('Responds to verbal stimuli');
          break;
      }
    }

    return score;
  }

  private static evaluateSymptoms(symptoms: Symptom[], reasons: string[]): number {
    let score = 0;

    const criticalSymptoms = [
      'chest pain', 'difficulty breathing', 'severe bleeding', 'stroke symptoms',
      'altered mental status', 'severe head injury', 'seizure', 'loss of consciousness',
      'suspected heart attack', 'anaphylaxis', 'severe burns'
    ];

    const urgentSymptoms = [
      'moderate bleeding', 'severe pain', 'high fever', 'vomiting blood',
      'severe dehydration', 'broken bone', 'severe allergic reaction'
    ];

    for (const symptom of symptoms) {
      const lowerSymptom = symptom.symptom.toLowerCase();

      if (criticalSymptoms.some(cs => lowerSymptom.includes(cs))) {
        score += symptom.severity === 'critical' ? 40 : 30;
        reasons.push(`Critical symptom: ${symptom.symptom} (${symptom.severity})`);
      } else if (urgentSymptoms.some(us => lowerSymptom.includes(us))) {
        score += symptom.severity === 'severe' ? 25 : 15;
        reasons.push(`Urgent symptom: ${symptom.symptom} (${symptom.severity})`);
      } else {
        if (symptom.severity === 'critical') score += 20;
        else if (symptom.severity === 'severe') score += 12;
        else if (symptom.severity === 'moderate') score += 6;
        else score += 2;

        if (symptom.severity !== 'mild') {
          reasons.push(`${symptom.severity} ${symptom.symptom}`);
        }
      }
    }

    return score;
  }

  private static evaluateRiskFactors(
    riskFactors: RiskFactor[],
    age: number | undefined,
    reasons: string[]
  ): number {
    let score = 0;

    if (age !== undefined) {
      if (age < 1) {
        score += 15;
        reasons.push('Infant - high risk');
      } else if (age < 5 || age > 75) {
        score += 10;
        reasons.push(`Age-related risk: ${age} years`);
      } else if (age > 65) {
        score += 5;
        reasons.push(`Elderly patient: ${age} years`);
      }
    }

    const highRiskConditions = [
      'cardiac', 'respiratory', 'diabetes', 'immunocompromised',
      'pregnancy', 'cancer', 'organ transplant', 'renal failure'
    ];

    for (const risk of riskFactors) {
      const lowerFactor = risk.factor.toLowerCase();

      if (highRiskConditions.some(hr => lowerFactor.includes(hr))) {
        score += 12;
        reasons.push(`High-risk condition: ${risk.factor}`);
      } else {
        score += 5;
        reasons.push(`Risk factor: ${risk.factor}`);
      }
    }

    return score;
  }

  public static shouldEscalate(
    currentPriority: Priority,
    waitingTimeMinutes: number,
    newVitals?: VitalSigns
  ): { shouldEscalate: boolean; newPriority?: Priority; reason?: string } {
    const waitThresholds = {
      RED: 0,
      YELLOW: Number(process.env.CRITICAL_WAIT_TIME_MINUTES) || 15,
      GREEN: Number(process.env.HIGH_WAIT_TIME_MINUTES) || 60,
      BLUE: Number(process.env.MEDIUM_WAIT_TIME_MINUTES) || 120
    };

    if (currentPriority !== 'RED' && waitingTimeMinutes > waitThresholds[currentPriority]) {
      const priorityOrder = ['BLUE', 'GREEN', 'YELLOW', 'RED'];
      const currentIndex = priorityOrder.indexOf(currentPriority);
      const newPriority = priorityOrder[currentIndex + 1] as Priority;

      return {
        shouldEscalate: true,
        newPriority,
        reason: `Waiting time exceeded threshold: ${waitingTimeMinutes} minutes`
      };
    }

    if (newVitals) {
      const vitalReasons: string[] = [];
      const vitalScore = this.evaluateVitalSigns(newVitals, vitalReasons);

      if (vitalScore >= this.CRITICAL_THRESHOLD && currentPriority !== 'RED') {
        return {
          shouldEscalate: true,
          newPriority: 'RED',
          reason: `Vital signs deteriorated: ${vitalReasons.join(', ')}`
        };
      } else if (vitalScore >= this.HIGH_THRESHOLD && (currentPriority === 'GREEN' || currentPriority === 'BLUE')) {
        return {
          shouldEscalate: true,
          newPriority: 'YELLOW',
          reason: `Vital signs worsened: ${vitalReasons.join(', ')}`
        };
      }
    }

    return { shouldEscalate: false };
  }
}
