const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://appointment_user:appointment_pass@localhost:5435/appointment_db'
});

const sampleDoctors = [
  {
    first_name: 'Dieu',
    last_name: 'Phan',
    email: 'doctor@gmail.com',
    phone_number: '+1-555-CHIRO',
    specializations: ['Chiropractic', 'Spinal Manipulation', 'Pain Management'],
    license_number: 'DC12345',
    years_experience: 12,
    education: ['Doctor of Chiropractic - Palmer College of Chiropractic', 'Bachelor of Science - Kinesiology'],
    certifications: ['Licensed Chiropractor', 'Certified Chiropractic Sports Physician', 'Dry Needling Certification'],
    bio: 'Dr. Dieu Phan D.C. is a dedicated chiropractor specializing in spinal health, pain management, and sports injury rehabilitation. With over 12 years of experience, Dr. Phan provides comprehensive chiropractic care to help patients achieve optimal health and wellness.',
    consultation_fee: 180.00,
    rating: 4.9,
    total_reviews: 387,
    is_available: true,
    status: 'active'
  },
  {
    first_name: 'John',
    last_name: 'Smith',
    email: 'dr.john.smith@clinic.com',
    phone_number: '+1-555-0101',
    specializations: ['General Practice', 'Family Medicine'],
    license_number: 'MD12345',
    years_experience: 15,
    education: ['MD - Harvard Medical School', 'Residency - Johns Hopkins'],
    certifications: ['Board Certified Family Medicine', 'CPR Certified'],
    bio: 'Dr. Smith is a dedicated family physician with over 15 years of experience providing comprehensive healthcare.',
    consultation_fee: 150.00,
    rating: 4.8,
    total_reviews: 245,
    is_available: true,
    status: 'active'
  },
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'dr.sarah.johnson@clinic.com',
    phone_number: '+1-555-0102',
    specializations: ['Orthopedics', 'Sports Medicine'],
    license_number: 'MD23456',
    years_experience: 12,
    education: ['MD - Stanford Medical School', 'Fellowship - Mayo Clinic'],
    certifications: ['Board Certified Orthopedic Surgery', 'Sports Medicine Certificate'],
    bio: 'Dr. Johnson specializes in orthopedic surgery and sports medicine, helping athletes and active individuals recover.',
    consultation_fee: 200.00,
    rating: 4.9,
    total_reviews: 189,
    is_available: true,
    status: 'active'
  },
  {
    first_name: 'Michael',
    last_name: 'Chen',
    email: 'dr.michael.chen@clinic.com',
    phone_number: '+1-555-0103',
    specializations: ['Neurology', 'Pain Management'],
    license_number: 'MD34567',
    years_experience: 18,
    education: ['MD - UCLA Medical School', 'Neurology Residency - UCSF'],
    certifications: ['Board Certified Neurology', 'Pain Management Specialist'],
    bio: 'Dr. Chen is a neurologist with extensive experience in treating neurological disorders and chronic pain.',
    consultation_fee: 250.00,
    rating: 4.7,
    total_reviews: 156,
    is_available: true,
    status: 'active'
  },
  {
    first_name: 'Emily',
    last_name: 'Rodriguez',
    email: 'dr.emily.rodriguez@clinic.com',
    phone_number: '+1-555-0104',
    specializations: ['Physical Therapy', 'Rehabilitation'],
    license_number: 'PT45678',
    years_experience: 8,
    education: ['DPT - University of Southern California', 'Manual Therapy Certificate'],
    certifications: ['Licensed Physical Therapist', 'Orthopedic Manual Therapy'],
    bio: 'Dr. Rodriguez is a skilled physical therapist specializing in orthopedic rehabilitation and manual therapy.',
    consultation_fee: 120.00,
    rating: 4.6,
    total_reviews: 98,
    is_available: true,
    status: 'active'
  },
  {
    first_name: 'David',
    last_name: 'Wilson',
    email: 'dr.david.wilson@clinic.com',
    phone_number: '+1-555-0105',
    specializations: ['Cardiology'],
    license_number: 'MD56789',
    years_experience: 20,
    education: ['MD - Johns Hopkins', 'Cardiology Fellowship - Cleveland Clinic'],
    certifications: ['Board Certified Cardiology', 'Interventional Cardiology'],
    bio: 'Dr. Wilson is a cardiologist with two decades of experience in treating heart conditions and performing interventional procedures.',
    consultation_fee: 300.00,
    rating: 4.9,
    total_reviews: 312,
    is_available: true,
    status: 'active'
  }
];

const sampleAvailability = [
  // Dr. Dieu Phan D.C. (ID: 1) - Monday to Friday, 8 AM to 6 PM
  { doctor_id: 1, day_of_week: 1, start_time: '08:00', end_time: '18:00', is_available: true },
  { doctor_id: 1, day_of_week: 2, start_time: '08:00', end_time: '18:00', is_available: true },
  { doctor_id: 1, day_of_week: 3, start_time: '08:00', end_time: '18:00', is_available: true },
  { doctor_id: 1, day_of_week: 4, start_time: '08:00', end_time: '18:00', is_available: true },
  { doctor_id: 1, day_of_week: 5, start_time: '08:00', end_time: '18:00', is_available: true },
  { doctor_id: 1, day_of_week: 6, start_time: '09:00', end_time: '15:00', is_available: true }, // Saturday half day
  
  // Dr. John Smith (ID: 2) - Monday to Friday, 9 AM to 5 PM
  { doctor_id: 2, day_of_week: 1, start_time: '09:00', end_time: '17:00', is_available: true },
  { doctor_id: 2, day_of_week: 2, start_time: '09:00', end_time: '17:00', is_available: true },
  { doctor_id: 2, day_of_week: 3, start_time: '09:00', end_time: '17:00', is_available: true },
  { doctor_id: 2, day_of_week: 4, start_time: '09:00', end_time: '17:00', is_available: true },
  { doctor_id: 2, day_of_week: 5, start_time: '09:00', end_time: '17:00', is_available: true },
  
  // Dr. Sarah Johnson (ID: 3) - Monday, Wednesday, Friday 8 AM to 4 PM
  { doctor_id: 3, day_of_week: 1, start_time: '08:00', end_time: '16:00', is_available: true },
  { doctor_id: 3, day_of_week: 3, start_time: '08:00', end_time: '16:00', is_available: true },
  { doctor_id: 3, day_of_week: 5, start_time: '08:00', end_time: '16:00', is_available: true },
  
  // Dr. Michael Chen (ID: 4) - Tuesday to Saturday, 10 AM to 6 PM
  { doctor_id: 4, day_of_week: 2, start_time: '10:00', end_time: '18:00', is_available: true },
  { doctor_id: 4, day_of_week: 3, start_time: '10:00', end_time: '18:00', is_available: true },
  { doctor_id: 4, day_of_week: 4, start_time: '10:00', end_time: '18:00', is_available: true },
  { doctor_id: 4, day_of_week: 5, start_time: '10:00', end_time: '18:00', is_available: true },
  { doctor_id: 4, day_of_week: 6, start_time: '10:00', end_time: '18:00', is_available: true },
  
  // Dr. Emily Rodriguez (ID: 5) - Monday to Thursday, 8 AM to 4 PM
  { doctor_id: 5, day_of_week: 1, start_time: '08:00', end_time: '16:00', is_available: true },
  { doctor_id: 5, day_of_week: 2, start_time: '08:00', end_time: '16:00', is_available: true },
  { doctor_id: 5, day_of_week: 3, start_time: '08:00', end_time: '16:00', is_available: true },
  { doctor_id: 5, day_of_week: 4, start_time: '08:00', end_time: '16:00', is_available: true },
  
  // Dr. David Wilson (ID: 6) - Monday to Friday, 7 AM to 3 PM
  { doctor_id: 6, day_of_week: 1, start_time: '07:00', end_time: '15:00', is_available: true },
  { doctor_id: 6, day_of_week: 2, start_time: '07:00', end_time: '15:00', is_available: true },
  { doctor_id: 6, day_of_week: 3, start_time: '07:00', end_time: '15:00', is_available: true },
  { doctor_id: 6, day_of_week: 4, start_time: '07:00', end_time: '15:00', is_available: true },
  { doctor_id: 6, day_of_week: 5, start_time: '07:00', end_time: '15:00', is_available: true }
];

async function seedDoctors() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding sample doctors...');
    
    // Insert doctors
    for (const doctor of sampleDoctors) {
      const query = `
        INSERT INTO doctors (
          first_name, last_name, email, phone_number, specializations,
          license_number, years_experience, education, certifications,
          bio, consultation_fee, rating, total_reviews, is_available, status,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
        ) ON CONFLICT (email) DO NOTHING RETURNING id;
      `;
      
      const values = [
        doctor.first_name, doctor.last_name, doctor.email, doctor.phone_number,
        doctor.specializations, doctor.license_number, doctor.years_experience,
        doctor.education, doctor.certifications, doctor.bio, doctor.consultation_fee,
        doctor.rating, doctor.total_reviews, doctor.is_available, doctor.status
      ];
      
      const result = await client.query(query, values);
      if (result.rows.length > 0) {
        console.log(`✅ Created doctor: ${doctor.first_name} ${doctor.last_name}`);
      } else {
        console.log(`⚠️  Doctor already exists: ${doctor.first_name} ${doctor.last_name}`);
      }
    }
    
    // Insert availability
    console.log('🕒 Setting up doctor availability...');
    for (const availability of sampleAvailability) {
      const query = `
        INSERT INTO doctor_availability (
          doctor_id, day_of_week, start_time, end_time, is_available, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT DO NOTHING;
      `;
      
      const values = [
        availability.doctor_id, availability.day_of_week, availability.start_time,
        availability.end_time, availability.is_available
      ];
      
      await client.query(query, values);
    }
    
    console.log('✅ Sample doctors and availability seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedDoctors();
}

module.exports = seedDoctors; 