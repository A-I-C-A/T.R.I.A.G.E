import { Knex } from 'knex';
import { hashPassword } from '../../utils/auth';

export async function seed(knex: Knex): Promise<void> {
  await knex('users').del();

  const adminPassword = await hashPassword('admin123');
  const doctorPassword = await hashPassword('doctor123');
  const govPassword = await hashPassword('gov123');

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
      hospital_id: 2,
      email: 'admin@centralmedical.com',
      password_hash: adminPassword,
      name: 'Central Admin',
      role: 'admin',
      is_active: true
    },
    {
      id: 4,
      email: 'government@health.gov',
      password_hash: govPassword,
      name: 'Government Official',
      role: 'government',
      is_active: true
    }
  ]);
}
