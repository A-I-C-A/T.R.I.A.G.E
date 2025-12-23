const knex = require('knex');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const knexConfig = require('./knexfile');
const environment = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[environment]);

async function createAdmin() {
  try {
    // Check if admin exists
    const existingAdmin = await db('users').where({ email: 'admin@hospital.com' }).first();
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      process.exit(0);
    }

    // Create a default hospital first
    let hospital = await db('hospitals').where({ name: 'City General Hospital' }).first();
    
    if (!hospital) {
      const [hospitalId] = await db('hospitals').insert({
        name: 'City General Hospital',
        location: 'Downtown',
        contact: '+1-555-0100',
        total_beds: 100,
        available_beds: 50,
        icu_beds: 20,
        available_icu_beds: 10,
        is_active: true
      });
      hospital = { id: hospitalId };
      console.log('✅ Created default hospital');
    }

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await db('users').insert({
      hospital_id: hospital.id,
      email: 'admin@hospital.com',
      password_hash: passwordHash,
      name: 'System Administrator',
      role: 'admin',
      is_active: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@hospital.com');
    console.log('🔑 Password: admin123');
    console.log('');
    console.log('⚠️  Please change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
