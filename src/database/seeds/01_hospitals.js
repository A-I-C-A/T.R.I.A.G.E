exports.seed = async function(knex) {
  await knex('hospitals').del();

  await knex('hospitals').insert([
    {
      id: 1,
      name: 'City General Hospital',
      location: 'Downtown, Main Street',
      contact: '+1-555-0100',
      total_beds: 200,
      available_beds: 20,  // 90% occupancy - CRITICAL
      icu_beds: 30,
      available_icu_beds: 5,
      is_active: true
    },
    {
      id: 2,
      name: 'Central Medical Center',
      location: 'Central District',
      contact: '+1-555-0200',
      total_beds: 150,
      available_beds: 30,  // 80% occupancy - BUSY
      icu_beds: 20,
      available_icu_beds: 8,
      is_active: true
    },
    {
      id: 3,
      name: 'Metropolitan Emergency Clinic',
      location: 'Westside Avenue',
      contact: '+1-555-0300',
      total_beds: 100,
      available_beds: 60,  // 40% occupancy - NORMAL
      icu_beds: 15,
      available_icu_beds: 10,
      is_active: true
    },
    {
      id: 4,
      name: 'North District Hospital',
      location: 'North Quarter',
      contact: '+1-555-0400',
      total_beds: 120,
      available_beds: 10,  // 92% occupancy - CRITICAL
      icu_beds: 18,
      available_icu_beds: 2,
      is_active: true
    },
    {
      id: 5,
      name: 'Westside Trauma Center',
      location: 'West End',
      contact: '+1-555-0500',
      total_beds: 80,
      available_beds: 20,  // 75% occupancy - BUSY
      icu_beds: 12,
      available_icu_beds: 4,
      is_active: true
    }
  ]);
};
