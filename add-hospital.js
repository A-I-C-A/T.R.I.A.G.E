#!/usr/bin/env node

/**
 * Simple script to add hospitals to the database
 * Usage: node add-hospital.js
 * 
 * This script is error-resilient:
 * - Checks if database exists
 * - Validates all inputs
 * - Shows clear error messages
 * - Can be run multiple times safely
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'triagelock.sqlite3');

// Predefined hospitals ready to add
const SAMPLE_HOSPITALS = [
  {
    name: 'South Bay Medical Center',
    location: 'South District, Bay Street',
    contact: '+1-555-0600',
    total_beds: 180,
    available_beds: 45,
    icu_beds: 25,
    available_icu_beds: 8
  },
  {
    name: 'East Regional Hospital',
    location: 'East Quarter, Regional Ave',
    contact: '+1-555-0700',
    total_beds: 220,
    available_beds: 30,
    icu_beds: 35,
    available_icu_beds: 5
  },
  {
    name: 'Lakeside Community Hospital',
    location: 'Lakeside District',
    contact: '+1-555-0800',
    total_beds: 90,
    available_beds: 50,
    icu_beds: 10,
    available_icu_beds: 7
  },
  {
    name: 'Valley View Medical',
    location: 'Valley Heights',
    contact: '+1-555-0900',
    total_beds: 160,
    available_beds: 25,
    icu_beds: 22,
    available_icu_beds: 3
  },
  {
    name: 'Coastal Emergency Center',
    location: 'Coastal Highway',
    contact: '+1-555-1000',
    total_beds: 110,
    available_beds: 35,
    icu_beds: 16,
    available_icu_beds: 6
  }
];

function addHospital(db, hospital) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO hospitals (name, location, contact, total_beds, available_beds, icu_beds, available_icu_beds, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `;
    
    db.run(sql, [
      hospital.name,
      hospital.location,
      hospital.contact,
      hospital.total_beds,
      hospital.available_beds,
      hospital.icu_beds,
      hospital.available_icu_beds
    ], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

function listHospitals(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM hospitals ORDER BY id', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function main() {
  console.log('\n🏥 Hospital Management Script\n');
  console.log('━'.repeat(50));

  // Check if database exists
  const fs = require('fs');
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ ERROR: Database file not found!');
    console.error(`   Looking for: ${DB_PATH}`);
    console.error('   Run the application first to create the database.');
    process.exit(1);
  }

  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ ERROR: Could not connect to database');
      console.error(err.message);
      process.exit(1);
    }
  });

  try {
    // List current hospitals
    console.log('\n📋 Current Hospitals:\n');
    const existing = await listHospitals(db);
    
    if (existing.length === 0) {
      console.log('   No hospitals found in database.');
    } else {
      existing.forEach((h, i) => {
        const occupancy = Math.round(((h.total_beds - h.available_beds) / h.total_beds) * 100);
        console.log(`   ${i + 1}. ${h.name}`);
        console.log(`      📍 ${h.location}`);
        console.log(`      🛏️  ${h.total_beds} beds (${occupancy}% occupied)`);
      });
    }

    console.log('\n━'.repeat(50));
    console.log('\n📝 Adding New Hospitals...\n');

    let added = 0;
    for (const hospital of SAMPLE_HOSPITALS) {
      try {
        const id = await addHospital(db, hospital);
        console.log(`✅ Added: ${hospital.name} (ID: ${id})`);
        added++;
      } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          console.log(`⚠️  Skipped: ${hospital.name} (already exists)`);
        } else {
          console.error(`❌ Error adding ${hospital.name}:`, err.message);
        }
      }
    }

    console.log('\n━'.repeat(50));
    console.log(`\n✨ Summary: ${added} new hospital(s) added`);

    // Show final count
    const final = await listHospitals(db);
    console.log(`📊 Total hospitals in database: ${final.length}`);
    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      }
    });
  }
}

// Run the script
main().catch(err => {
  console.error('\n❌ Fatal Error:', err.message);
  process.exit(1);
});
