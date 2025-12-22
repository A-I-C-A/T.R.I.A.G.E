import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('staff_availability').del();

  await knex('staff_availability').insert([
    {
      hospital_id: 1,
      role: 'doctor',
      available_count: 15,
      total_count: 20,
      updated_at: new Date()
    },
    {
      hospital_id: 1,
      role: 'nurse',
      available_count: 30,
      total_count: 40,
      updated_at: new Date()
    },
    {
      hospital_id: 2,
      role: 'doctor',
      available_count: 10,
      total_count: 15,
      updated_at: new Date()
    },
    {
      hospital_id: 2,
      role: 'nurse',
      available_count: 20,
      total_count: 25,
      updated_at: new Date()
    },
    {
      hospital_id: 3,
      role: 'doctor',
      available_count: 8,
      total_count: 10,
      updated_at: new Date()
    },
    {
      hospital_id: 3,
      role: 'nurse',
      available_count: 15,
      total_count: 20,
      updated_at: new Date()
    }
  ]);
}
