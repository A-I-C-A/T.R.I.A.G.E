exports.up = async function(knex) {
  await knex.schema.table('patients', (table) => {
    table.string('recommended_specialty', 100).defaultTo('General');
    table.integer('doctor_id').unsigned();
  });
};

exports.down = async function(knex) {
  await knex.schema.table('patients', (table) => {
    table.dropColumn('recommended_specialty');
    table.dropColumn('doctor_id');
  });
};
