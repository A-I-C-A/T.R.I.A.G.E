const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Clear existing patients
  await knex('patients').del();

  // Sample patient data (without doctor_id as it doesn't exist in schema)
  const patients = [
    {
      id: 1,
      hospital_id: 1,
      name: 'John Miller',
      age: 45,
      gender: 'Male',
      triage_level: 'RED',
      status: 'waiting',
      symptoms: JSON.stringify(['Chest Pain', 'Shortness of Breath']),
      risk_factors: JSON.stringify(['Hypertension', 'Diabetes']),
      vitals: JSON.stringify({ hr: 125, rr: 24, bpSys: 160, bpDia: 95, spo2: 88, temp: 37.2, avpu: 'Alert' }),
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
      symptoms: JSON.stringify(['Abdominal Pain', 'Nausea', 'Vomiting']),
      risk_factors: JSON.stringify(['Pregnancy']),
      vitals: JSON.stringify({ hr: 95, rr: 18, bpSys: 130, bpDia: 82, spo2: 97, temp: 37.8, avpu: 'Alert' }),
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
      status: 'in-treatment',
      symptoms: JSON.stringify(['Dizziness', 'Headache', 'Confusion']),
      risk_factors: JSON.stringify(['Elderly (>65)', 'Hypertension']),
      vitals: JSON.stringify({ hr: 110, rr: 22, bpSys: 180, bpDia: 105, spo2: 92, temp: 36.8, avpu: 'Voice' }),
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
      symptoms: JSON.stringify(['Fever', 'Headache']),
      risk_factors: JSON.stringify([]),
      vitals: JSON.stringify({ hr: 88, rr: 16, bpSys: 120, bpDia: 78, spo2: 98, temp: 38.5, avpu: 'Alert' }),
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
      symptoms: JSON.stringify(['Trauma', 'Bleeding']),
      risk_factors: JSON.stringify(['Recent Surgery']),
      vitals: JSON.stringify({ hr: 105, rr: 20, bpSys: 140, bpDia: 88, spo2: 95, temp: 37.0, avpu: 'Alert' }),
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
      symptoms: JSON.stringify(['Shortness of Breath', 'Fever']),
      risk_factors: JSON.stringify(['Asthma']),
      vitals: JSON.stringify({ hr: 98, rr: 24, bpSys: 135, bpDia: 85, spo2: 93, temp: 38.2, avpu: 'Alert' }),
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
      symptoms: JSON.stringify(['Chest Pain', 'Dizziness']),
      risk_factors: JSON.stringify(['Elderly (>65)', 'Heart Disease', 'Diabetes']),
      vitals: JSON.stringify({ hr: 130, rr: 26, bpSys: 170, bpDia: 98, spo2: 89, temp: 37.1, avpu: 'Alert' }),
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
      symptoms: JSON.stringify(['Nausea', 'Headache']),
      risk_factors: JSON.stringify([]),
      vitals: JSON.stringify({ hr: 82, rr: 15, bpSys: 118, bpDia: 76, spo2: 99, temp: 37.3, avpu: 'Alert' }),
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
      symptoms: JSON.stringify(['Abdominal Pain', 'Fever']),
      risk_factors: JSON.stringify(['Diabetes']),
      vitals: JSON.stringify({ hr: 92, rr: 19, bpSys: 145, bpDia: 90, spo2: 96, temp: 38.7, avpu: 'Alert' }),
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
      symptoms: JSON.stringify(['Headache']),
      risk_factors: JSON.stringify([]),
      vitals: JSON.stringify({ hr: 78, rr: 14, bpSys: 115, bpDia: 72, spo2: 99, temp: 36.9, avpu: 'Alert' }),
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
      symptoms: JSON.stringify(['Trauma', 'Bleeding', 'Dizziness']),
      risk_factors: JSON.stringify([]),
      vitals: JSON.stringify({ hr: 108, rr: 22, bpSys: 138, bpDia: 86, spo2: 94, temp: 37.0, avpu: 'Alert' }),
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
      status: 'in-treatment',
      symptoms: JSON.stringify(['Shortness of Breath', 'Chest Pain']),
      risk_factors: JSON.stringify(['Elderly (>65)', 'Heart Disease']),
      vitals: JSON.stringify({ hr: 122, rr: 28, bpSys: 165, bpDia: 100, spo2: 87, temp: 37.4, avpu: 'Alert' }),
      recommended_specialty: 'Cardiology',
      created_at: new Date(Date.now() - 50 * 60000)
    }
  ];

  await knex('patients').insert(patients);
};
