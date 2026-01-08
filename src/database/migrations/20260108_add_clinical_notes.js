exports.up = async function(knex) {
  await knex.schema.table('patients', (table) => {
    table.text('clinical_notes');
    table.text('doctor_notes');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('patients', (table) => {
    table.dropColumn('clinical_notes');
    table.dropColumn('doctor_notes');
  });
};
