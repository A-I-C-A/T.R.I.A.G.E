exports.up = async function(knex) {
  await knex.schema.createTable('hospitals', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('location', 255).notNullable();
    table.string('contact', 50);
    table.integer('total_beds').defaultTo(0);
    table.integer('available_beds').defaultTo(0);
    table.integer('icu_beds').defaultTo(0);
    table.integer('available_icu_beds').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.integer('hospital_id').unsigned().references('id').inTable('hospitals').onDelete('CASCADE');
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255).notNullable();
    table.enum('role', ['admin', 'doctor', 'nurse', 'staff', 'government']).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('patients', (table) => {
    table.increments('id').primary();
    table.integer('hospital_id').unsigned().references('id').inTable('hospitals').onDelete('CASCADE');
    table.string('patient_id', 50).notNullable();
    table.string('name', 255);
    table.integer('age');
    table.enum('gender', ['male', 'female', 'other']);
    table.string('contact', 50);
    table.enum('priority', ['RED', 'YELLOW', 'GREEN', 'BLUE']).notNullable();
    table.enum('status', ['waiting', 'in_treatment', 'discharged', 'admitted', 'referred']).defaultTo('waiting');
    table.timestamp('arrival_time').notNullable();
    table.timestamp('triage_time');
    table.timestamp('treatment_start_time');
    table.timestamp('discharge_time');
    table.integer('waiting_time_minutes').defaultTo(0);
    table.boolean('escalated').defaultTo(false);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('vital_signs', (table) => {
    table.increments('id').primary();
    table.integer('patient_id').unsigned().references('id').inTable('patients').onDelete('CASCADE');
    table.integer('heart_rate');
    table.integer('respiratory_rate');
    table.integer('systolic_bp');
    table.integer('diastolic_bp');
    table.decimal('temperature', 4, 1);
    table.integer('oxygen_saturation');
    table.enum('consciousness', ['alert', 'verbal', 'pain', 'unresponsive']);
    table.timestamp('recorded_at').notNullable();
  });

  await knex.schema.createTable('symptoms', (table) => {
    table.increments('id').primary();
    table.integer('patient_id').unsigned().references('id').inTable('patients').onDelete('CASCADE');
    table.string('symptom', 255).notNullable();
    table.enum('severity', ['mild', 'moderate', 'severe', 'critical']).notNullable();
    table.text('notes');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('risk_factors', (table) => {
    table.increments('id').primary();
    table.integer('patient_id').unsigned().references('id').inTable('patients').onDelete('CASCADE');
    table.string('factor', 255).notNullable();
    table.string('category', 100);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('triage_history', (table) => {
    table.increments('id').primary();
    table.integer('patient_id').unsigned().references('id').inTable('patients').onDelete('CASCADE');
    table.enum('old_priority', ['RED', 'YELLOW', 'GREEN', 'BLUE']);
    table.enum('new_priority', ['RED', 'YELLOW', 'GREEN', 'BLUE']).notNullable();
    table.string('reason', 500).notNullable();
    table.boolean('auto_escalated').defaultTo(false);
    table.integer('triggered_by_user').unsigned().references('id').inTable('users');
    table.timestamp('changed_at').notNullable();
  });

  await knex.schema.createTable('staff_availability', (table) => {
    table.increments('id').primary();
    table.integer('hospital_id').unsigned().references('id').inTable('hospitals').onDelete('CASCADE');
    table.enum('role', ['doctor', 'nurse', 'specialist', 'support']).notNullable();
    table.integer('available_count').defaultTo(0);
    table.integer('total_count').defaultTo(0);
    table.timestamp('updated_at').notNullable();
  });

  await knex.schema.createTable('alerts', (table) => {
    table.increments('id').primary();
    table.integer('hospital_id').unsigned().references('id').inTable('hospitals').onDelete('CASCADE');
    table.integer('patient_id').unsigned().references('id').inTable('patients').onDelete('CASCADE');
    table.enum('type', ['escalation', 'overload', 'critical_wait', 'bed_shortage', 'staff_shortage']).notNullable();
    table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable();
    table.string('message', 500).notNullable();
    table.boolean('acknowledged').defaultTo(false);
    table.integer('acknowledged_by').unsigned().references('id').inTable('users');
    table.timestamp('acknowledged_at');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('incident_reports', (table) => {
    table.increments('id').primary();
    table.integer('hospital_id').unsigned().references('id').inTable('hospitals').onDelete('CASCADE');
    table.date('incident_date').notNullable();
    table.integer('total_patients').defaultTo(0);
    table.integer('red_priority_count').defaultTo(0);
    table.integer('yellow_priority_count').defaultTo(0);
    table.integer('green_priority_count').defaultTo(0);
    table.integer('average_wait_time_minutes').defaultTo(0);
    table.integer('max_wait_time_minutes').defaultTo(0);
    table.integer('escalation_count').defaultTo(0);
    table.integer('peak_load').defaultTo(0);
    table.timestamp('peak_time');
    table.text('hourly_stats');
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('incident_reports');
  await knex.schema.dropTableIfExists('alerts');
  await knex.schema.dropTableIfExists('staff_availability');
  await knex.schema.dropTableIfExists('triage_history');
  await knex.schema.dropTableIfExists('risk_factors');
  await knex.schema.dropTableIfExists('symptoms');
  await knex.schema.dropTableIfExists('vital_signs');
  await knex.schema.dropTableIfExists('patients');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('hospitals');
};
