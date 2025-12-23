export interface User {
  id: string;
  email: string;
  role: 'nurse' | 'doctor' | 'admin' | 'government';
  hospitalId?: string;
  name?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  triageLevel: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';
  symptoms: string[];
  vitals: {
    hr?: number;
    rr?: number;
    bpSys?: number;
    bpDia?: number;
    spo2?: number;
    temp?: number;
    avpu?: string;
  };
  status: 'waiting' | 'in-treatment' | 'discharged';
  arrivalTime: string;
  doctorId?: string;
  hospitalId: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  capacity: {
    total: number;
    available: number;
    emergency: number;
  };
  departments: string[];
  currentLoad: number;
}

export interface TriageResult {
  level: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';
  score: number;
  reasons: string[];
  recommendedSpecialty: string;
  recommendedHospital?: string;
}

export interface Analytics {
  totalPatients: number;
  byTriageLevel: {
    RED: number;
    YELLOW: number;
    GREEN: number;
    BLUE: number;
  };
  averageWaitTime: number;
  hospitalLoad: number;
}
