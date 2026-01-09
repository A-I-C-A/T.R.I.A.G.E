exports.up = async function(knex) {
  console.log('Fixing ai_predictions table schema...');
  
  try {
    const hasModelType = await knex.schema.hasColumn('ai_predictions', 'model_type');
    const hasReasoning = await knex.schema.hasColumn('ai_predictions', 'reasoning');
    
    await knex.schema.table('ai_predictions', (table) => {
      if (!hasModelType) {
        table.string('model_type', 50);
        console.log('✓ Added model_type column');
      }
      if (!hasReasoning) {
        table.text('reasoning');
        console.log('✓ Added reasoning column');
      }
    });
    
    console.log('✅ ai_predictions schema fixed');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
};

exports.down = async function(knex) {
  await knex.schema.table('ai_predictions', (table) => {
    table.dropColumn('model_type');
    table.dropColumn('reasoning');
  });
};
