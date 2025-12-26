const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Clear existing tables
  await knex('vital_signs').del();
  await knex('symptoms').del();
  await knex('risk_factors').del();
  await knex('patients').del();

  // Sample patient data
  const patients = [
    {
      id: 1,
      hospital_id: 1,
      name: 'John Miller',
      age: 45,
      gender: 'Male',
      triage_level: 'RED',
      status: 'waiting',
      symptoms: ['Chest Pain', 'Shortness of Breath'],
      risk_factors: ['Hypertension', 'Diabetes'],
      vitals: { hr: 125, rr: 24, bpSys: 160, bpDia: 95, spo2: 88, temp: 37.2, avpu: 'Alert' },
      recommended_specialty: 'Cardiology',
      created_at: new Date(Date.now() - 15 * 60000)
    },
    {
      id: 2,
      hospital_id: 1,
      name: 'Sarah Johnson',
      age: 32,
      gender: 'Female',
      triage_level: 'YELLOW',
      status: 'waiting',
      symptoms: ['Abdominal Pain', 'Nausea', 'Vomiting'],
      risk_factors: ['Pregnancy'],
      vitals: { hr: 95, rr: 18, bpSys: 130, bpDia: 82, spo2: 97, temp: 37.8, avpu: 'Alert' },
      recommended_specialty: 'General',
      created_at: new Date(Date.now() - 30 * 60000)
    },
    {
      id: 3,
      hospital_id: 1,
      name: 'Robert Chen',
      age: 68,
      gender: 'Male',
      triage_level: 'RED',
      status: 'in_treatment',
      symptoms: ['Dizziness', 'Headache', 'Confusion'],
      risk_factors: ['Elderly (>65)', 'Hypertension'],
      vitals: { hr: 110, rr: 22, bpSys: 180, bpDia: 105, spo2: 92, temp: 36.8, avpu: 'Voice' },
      recommended_specialty: 'Neurology',
      created_at: new Date(Date.now() - 45 * 60000)
    },
    {
      id: 4,
      hospital_id: 1,
      name: 'Emily Davis',
      age: 28,
      gender: 'Female',
      triage_level: 'GREEN',
      status: 'waiting',
      symptoms: ['Fever', 'Headache'],
      risk_factors: [],
      vitals: { hr: 88, rr: 16, bpSys: 120, bpDia: 78, spo2: 98, temp: 38.5, avpu: 'Alert' },
      recommended_specialty: 'General',
      created_at: new Date(Date.now() - 20 * 60000)
    },
    {
      id: 5,
      hospital_id: 1,
      name: 'Michael Brown',
      age: 55,
      gender: 'Male',
      triage_level: 'YELLOW',
      status: 'waiting',
      symptoms: ['Trauma', 'Bleeding'],
      risk_factors: ['Recent Surgery'],
      vitals: { hr: 105, rr: 20, bpSys: 140, bpDia: 88, spo2: 95, temp: 37.0, avpu: 'Alert' },
      recommended_specialty: 'Trauma',
      created_at: new Date(Date.now() - 10 * 60000)
    },
    {
      id: 6,
      hospital_id: 2,
      name: 'Linda Martinez',
      age: 41,
      gender: 'Female',
      triage_level: 'YELLOW',
      status: 'waiting',
      symptoms: ['Shortness of Breath', 'Fever'],
      risk_factors: ['Asthma'],
      vitals: { hr: 98, rr: 24, bpSys: 135, bpDia: 85, spo2: 93, temp: 38.2, avpu: 'Alert' },
      recommended_specialty: 'Pulmonology',
      created_at: new Date(Date.now() - 35 * 60000)
    },
    {
      id: 7,
      hospital_id: 1,
      name: 'David Wilson',
      age: 72,
      gender: 'Male',
      triage_level: 'RED',
      status: 'waiting',
      symptoms: ['Chest Pain', 'Dizziness'],
      risk_factors: ['Elderly (>65)', 'Heart Disease', 'Diabetes'],
      vitals: { hr: 130, rr: 26, bpSys: 170, bpDia: 98, spo2: 89, temp: 37.1, avpu: 'Alert' },
      recommended_specialty: 'Cardiology',
      created_at: new Date(Date.now() - 5 * 60000)
    },
    {
      id: 8,
      hospital_id: 1,
      name: 'Jennifer Lee',
      age: 35,
      gender: 'Female',
      triage_level: 'GREEN',
      status: 'waiting',
      symptoms: ['Nausea', 'Headache'],
      risk_factors: [],
      vitals: { hr: 82, rr: 15, bpSys: 118, bpDia: 76, spo2: 99, temp: 37.3, avpu: 'Alert' },
      recommended_specialty: 'General',
      created_at: new Date(Date.now() - 25 * 60000)
    },
    {
      id: 9,
      hospital_id: 2,
      name: 'James Taylor',
      age: 59,
      gender: 'Male',
      triage_level: 'YELLOW',
      status: 'waiting',
      symptoms: ['Abdominal Pain', 'Fever'],
      risk_factors: ['Diabetes'],
      vitals: { hr: 92, rr: 19, bpSys: 145, bpDia: 90, spo2: 96, temp: 38.7, avpu: 'Alert' },
      recommended_specialty: 'General',
      created_at: new Date(Date.now() - 40 * 60000)
    },
    {
      id: 10,
      hospital_id: 1,
      name: 'Patricia Garcia',
      age: 48,
      gender: 'Female',
      triage_level: 'GREEN',
      status: 'discharged',
      symptoms: ['Headache'],
      risk_factors: [],
      vitals: { hr: 78, rr: 14, bpSys: 115, bpDia: 72, spo2: 99, temp: 36.9, avpu: 'Alert' },
      recommended_specialty: 'General',
      created_at: new Date(Date.now() - 120 * 60000)
    },
    {
      id: 11,
      hospital_id: 1,
      name: 'Christopher Anderson',
      age: 38,
      gender: 'Male',
      triage_level: 'YELLOW',
      status: 'waiting',
      symptoms: ['Trauma', 'Bleeding', 'Dizziness'],
      risk_factors: [],
      vitals: { hr: 108, rr: 22, bpSys: 138, bpDia: 86, spo2: 94, temp: 37.0, avpu: 'Alert' },
      recommended_specialty: 'Trauma',
      created_at: new Date(Date.now() - 12 * 60000)
    },
    {
      id: 12,
      hospital_id: 1,
      name: 'Mary Thomas',
      age: 63,
      gender: 'Female',
      triage_level: 'RED',
      status: 'in_treatment',
      symptoms: ['Shortness of Breath', 'Chest Pain'],
      risk_factors: ['Elderly (>65)', 'Heart Disease'],
      vitals: { hr: 122, rr: 28, bpSys: 165, bpDia: 100, spo2: 87, temp: 37.4, avpu: 'Alert' },
      recommended_specialty: 'Cardiology',
      created_at: new Date(Date.now() - 50 * 60000)
    }
  ];

  // Add many more demo patients programmatically to demonstrate surge scenarios
  for (let i = 13; i <= 120; i++) {
    const age = 20 + (i % 60);
    const gender = i % 2 === 0 ? 'Female' : 'Male';
    const triageLevels = ['GREEN','YELLOW','RED','GREEN'];
    const triage_level = triageLevels[i % triageLevels.length];
    const status = (i % 10 === 0) ? 'in_treatment' : 'waiting';
    const hr = 60 + (i % 90);
    const rr = 12 + (i % 20);
    const bpSys = 110 + (i % 90);
    const bpDia = 70 + (i % 30);
    const spo2 = 90 + (i % 10);
    const temp = 36 + ((i % 50) / 10);
    const symptoms = (i % 3 === 0) ? ['Fever','Cough'] : (i % 5 === 0) ? ['Abdominal Pain'] : ['Headache'];
    const risks = (i % 7 === 0) ? ['Diabetes'] : [];
    const hosp = (i % 3 === 0) ? 2 : 1;
    patients.push({
      id: i,
      hospital_id: hosp,
      name: `Demo Patient ${i}`,
      age,
      gender,
      triage_level,
      status,
      symptoms,
      risk_factors: risks,
      vitals: { hr, rr, bpSys, bpDia, spo2, temp, avpu: 'Alert' },
      recommended_specialty: 'General',
      created_at: new Date(Date.now() - (i % 180) * 60000)
    });
  }

  const mapAvpu = (v) => {
    if (!v) return 'alert';
    const val = String(v).toLowerCase();
    if (val === 'voice') return 'verbal';
    if (val === 'pain') return 'pain';
    if (val === 'unresponsive') return 'unresponsive';
    return 'alert';
  };

  // Insert into patients and related tables
  for (const p of patients) {
    const patientRow = {
      id: p.id,
      hospital_id: p.hospital_id,
      patient_id: `P-${p.id}`,
      name: p.name,
      age: p.age,
      gender: p.gender ? p.gender.toLowerCase() : null,
      priority: p.triage_level,
      status: p.status,
      arrival_time: p.created_at,
      waiting_time_minutes: 0,
      recommended_specialty: p.recommended_specialty || 'General',
      created_at: p.created_at,
      updated_at: new Date()
    };

    await knex('patients').insert(patientRow);

    // vitals
    const vit = p.vitals || {};
    await knex('vital_signs').insert({
      patient_id: p.id,
      heart_rate: vit.hr,
      respiratory_rate: vit.rr,
      systolic_bp: vit.bpSys,
      diastolic_bp: vit.bpDia,
      temperature: vit.temp,
      oxygen_saturation: vit.spo2,
      consciousness: mapAvpu(vit.avpu),
      recorded_at: p.created_at
    });

    // symptoms
    const syms = p.symptoms || [];
    for (const s of syms) {
      await knex('symptoms').insert({ patient_id: p.id, symptom: s, severity: 'moderate', notes: null, created_at: p.created_at, updated_at: new Date() });
    }

    // risk factors
    const risks = p.risk_factors || [];
    for (const r of risks) {
      await knex('risk_factors').insert({ patient_id: p.id, factor: r, category: null, created_at: p.created_at, updated_at: new Date() });
    }
  }
};
