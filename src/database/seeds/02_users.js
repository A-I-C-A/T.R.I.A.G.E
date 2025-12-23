const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  await knex('users').del();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const nursePassword = await bcrypt.hash('nurse123', 10);
  const govPassword = await bcrypt.hash('gov123', 10);

  await knex('users').insert([
    {
      id: 1,
      hospital_id: 1,
      email: 'admin@cityhospital.com',
      password_hash: adminPassword,
      name: 'Admin User',
      role: 'admin',
      is_active: true
    },
    {
      id: 2,
      hospital_id: 1,
      email: 'doctor@cityhospital.com',
      password_hash: doctorPassword,
      name: 'Dr. John Smith',
      role: 'doctor',
      is_active: true
    },
    {
      id: 3,
      hospital_id: 1,
      email: 'nurse@cityhospital.com',
      password_hash: nursePassword,
      name: 'Nurse Sarah Johnson',
      role: 'nurse',
      is_active: true
    },
    {
      id: 4,
      hospital_id: 2,
      email: 'admin@centralmedical.com',
      password_hash: adminPassword,
      name: 'Central Admin',
      role: 'admin',
      is_active: true
    },
    {
      id: 5,
      email: 'government@health.gov',
      password_hash: govPassword,
      name: 'Government Official',
      role: 'government',
      is_active: true
    },
    {
      id: 6,
      hospital_id: 4,
      email: 'admin@northdistrict.com',
      password_hash: adminPassword,
      name: 'North District Admin',
      role: 'admin',
      is_active: true
    },
    {
      id: 7,
      hospital_id: 5,
      email: 'admin@westsidetrauma.com',
      password_hash: adminPassword,
      name: 'Westside Admin',
      role: 'admin',
      is_active: true
    }
  ]);
};
