exports.seed = async function(knex) {
  await knex('hospitals').del();

  await knex('hospitals').insert([
    {
      id: 1,
      name: 'City General Hospital',
      location: 'Downtown, Main Street',
      contact: '+1-555-0100',
      total_beds: 200,
      available_beds: 150,
      icu_beds: 30,
      available_icu_beds: 20,
      is_active: true
    },
    {
      id: 2,
      name: 'Central Medical Center',
      location: 'Central District',
      contact: '+1-555-0200',
      total_beds: 150,
      available_beds: 100,
      icu_beds: 20,
      available_icu_beds: 15,
      is_active: true
    },
    {
      id: 3,
      name: 'Metropolitan Emergency Clinic',
      location: 'Westside Avenue',
      contact: '+1-555-0300',
      total_beds: 100,
      available_beds: 80,
      icu_beds: 15,
      available_icu_beds: 10,
      is_active: true
    }
  ]);
};
