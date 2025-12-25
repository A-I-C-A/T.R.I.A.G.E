exports.up = async function(knex) {
  // AI Predictions table
  const hasAiPredictions = await knex.schema.hasTable('ai_predictions');
  if (!hasAiPredictions) {
    await knex.schema.createTable('ai_predictions', (table) => {
      table.increments('id').primary();
      table.integer('patient_id').unsigned().references('id').inTable('patients').onDelete('CASCADE');
      table.string('model_version', 50).notNullable();
      table.decimal('risk_score', 5, 2);
      table.decimal('deterioration_probability', 5, 2);
      table.timestamp('predicted_escalation_time');
      table.decimal('confidence', 5, 2);
      table.json('features');
      table.json('shap_values');
      table.string('predicted_priority', 20);
      table.text('ai_reasoning');
      table.timestamps(true, true);
    });
  }

  // NLP Extracted Symptoms table
  const hasNlpExtractions = await knex.schema.hasTable('nlp_extractions');
  if (!hasNlpExtractions) {
    await knex.schema.createTable('nlp_extractions', (table) => {
      table.increments('id').primary();
      table.integer('patient_id').unsigned().references('id').inTable('patients').onDelete('CASCADE');
      table.text('raw_text').notNullable();
      table.json('extracted_symptoms');
      table.json('extracted_conditions');
      table.string('predicted_specialty', 100);
      table.decimal('confidence', 5, 2);
      table.string('language_detected', 10);
      table.timestamps(true, true);
    });
  }

  // Model Performance Tracking
  const hasModelPerformance = await knex.schema.hasTable('model_performance');
  if (!hasModelPerformance) {
    await knex.schema.createTable('model_performance', (table) => {
      table.increments('id').primary();
      table.string('model_name', 100).notNullable();
      table.string('version', 50).notNullable();
      table.decimal('accuracy', 5, 2);
      table.decimal('precision', 5, 2);
      table.decimal('recall', 5, 2);
      table.decimal('f1_score', 5, 2);
      table.decimal('auc_roc', 5, 2);
      table.integer('predictions_count').defaultTo(0);
      table.integer('correct_predictions').defaultTo(0);
      table.timestamps(true, true);
    });
  }

  // Surge Predictions
  const hasSurgePredictions = await knex.schema.hasTable('surge_predictions');
  if (!hasSurgePredictions) {
    await knex.schema.createTable('surge_predictions', (table) => {
      table.increments('id').primary();
      table.integer('hospital_id').unsigned().references('id').inTable('hospitals').onDelete('CASCADE');
      table.timestamp('prediction_time').notNullable();
      table.timestamp('predicted_for').notNullable();
      table.integer('predicted_patient_count');
      table.integer('actual_patient_count');
      table.json('hourly_forecast');
      table.decimal('confidence', 5, 2);
      table.json('recommendations');
      table.timestamps(true, true);
    });
  }

  // Add AI fields to patients table (check if columns don't exist first)
  const hasChiefComplaint = await knex.schema.hasColumn('patients', 'chief_complaint');
  const hasAiRiskScore = await knex.schema.hasColumn('patients', 'ai_risk_score');
  const hasAiWarning = await knex.schema.hasColumn('patients', 'ai_warning_active');
  
  if (!hasChiefComplaint || !hasAiRiskScore || !hasAiWarning) {
    await knex.schema.table('patients', (table) => {
      if (!hasChiefComplaint) table.text('chief_complaint');
      if (!hasAiRiskScore) table.decimal('ai_risk_score', 5, 2);
      if (!hasAiWarning) table.boolean('ai_warning_active').defaultTo(false);
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.table('patients', (table) => {
    table.dropColumn('chief_complaint');
    table.dropColumn('ai_risk_score');
    table.dropColumn('ai_warning_active');
  });

  await knex.schema.dropTableIfExists('surge_predictions');
  await knex.schema.dropTableIfExists('model_performance');
  await knex.schema.dropTableIfExists('nlp_extractions');
  await knex.schema.dropTableIfExists('ai_predictions');
};
