const axios = require('axios');
const API_URL = 'http://localhost:3000';
let authToken = '';

async function login() {
  console.log('Logging in...');
  const response = await axios.post(`/api/auth/login`, {
    email: 'nurse@cityhospital.com',
    password: 'nurse123'
  });
  authToken = response.data.token;
  console.log('Login successful!');
  return true;
}

async function createPatient(data, index) {
  const response = await axios.post(`/api/patients`, data, {
    headers: { 'Authorization': `Bearer ` }
  });
  console.log(`Created patient :  - `);
  return response.data;
}

async function main() {
  await login();
  const patients = [
    { name: 'John Miller', age: 45, gender: 'male', vitals: { heartRate: 125, respiratoryRate: 24, bloodPressureSystolic: 160, bloodPressureDiastolic: 95, oxygenSaturation: 88, temperature: 37.2, avpu: 'Alert' }, symptoms: ['Chest Pain'], riskFactors: ['Hypertension'] },
    { name: 'Sarah Johnson', age: 32, gender: 'female', vitals: { heartRate: 95, respiratoryRate: 18, bloodPressureSystolic: 130, bloodPressureDiastolic: 82, oxygenSaturation: 97, temperature: 37.8, avpu: 'Alert' }, symptoms: ['Abdominal Pain'], riskFactors: [] },
    { name: 'Robert Chen', age: 68, gender: 'male', vitals: { heartRate: 110, respiratoryRate: 22, bloodPressureSystolic: 180, bloodPressureDiastolic: 105, oxygenSaturation: 92, temperature: 36.8, avpu: 'Voice' }, symptoms: ['Dizziness'], riskFactors: ['Elderly (>65)'] }
  ];
  
  for (let i = 0; i < patients.length; i++) {
    const p = patients[i];
    await createPatient({
      patientId: `P--`,
      name: p.name,
      age: p.age,
      gender: p.gender,
      contact: '',
      triageInput: { vitalSigns: p.vitals, symptoms: p.symptoms, riskFactors: p.riskFactors }
    }, i);
    await new Promise(r => setTimeout(r, 300));
  }
  console.log('Done!');
}

main().catch(console.error);
