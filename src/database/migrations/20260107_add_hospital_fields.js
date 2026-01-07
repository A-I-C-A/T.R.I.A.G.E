exports.up = async function(knex) {
  // Add new columns to hospitals table
  await knex.schema.table('hospitals', (table) => {
    table.integer('general_ward_beds').defaultTo(0);
    table.integer('ventilators').defaultTo(0);
  });

  // Create hospital_staff table if it doesn't exist
  const hasTable = await knex.schema.hasTable('hospital_staff');
  if (!hasTable) {
    await knex.schema.createTable('hospital_staff', (table) => {
      table.increments('id').primary();
      table.integer('hospital_id').unsigned().references('id').inTable('hospitals').onDelete('CASCADE');
      table.enum('role', ['doctor', 'nurse', 'specialist', 'support']).notNullable();
      table.string('specialty', 100); // e.g., emergency, cardiology, neurology
      table.integer('total_count').defaultTo(0);
      table.integer('available_count').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
  }
};

exports.down = async function(knex) {
  // Remove new columns from hospitals table
  await knex.schema.table('hospitals', (table) => {
    table.dropColumn('general_ward_beds');
    table.dropColumn('ventilators');
  });

  // Drop hospital_staff table
  await knex.schema.dropTableIfExists('hospital_staff');
};
