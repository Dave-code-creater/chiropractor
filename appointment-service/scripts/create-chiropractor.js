const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://appointment_user:appointment_pass@localhost:5435/appointment_db'
});

const chiropractorData = {
  first_name: 'Dr. Alex',
  last_name: 'Thompson',
  email: 'dr.alex.thompson@clinic.com',
  phone_number: '+1-555-0199',
  specializations: ['Chiropractic', 'Pain Management', 'Sports Medicine'],
  license_number: 'DC12345',
  years_experience: 10,
  education: [
    'Doctor of Chiropractic - Palmer College of Chiropractic',
    'Bachelor of Science in Human Biology - University of Iowa'
  ],
  certifications: [
    'Licensed Doctor of Chiropractic',
    'Certified in Sports Chiropractic',
    'Active Release Techniques (ART) Certified',
    'Graston Technique Certified'
  ],
  bio: 'Dr. Thompson is a skilled chiropractor specializing in spinal manipulation, sports injuries, and chronic pain management. With over 10 years of experience, he helps patients achieve optimal spinal health and mobility through personalized treatment plans.',
  consultation_fee: 180.00,
  rating: 4.7,
  total_reviews: 134,
  is_available: true,
  status: 'active'
};

const chiropractorAvailability = [
  // Monday to Friday, 8 AM to 6 PM
  { day_of_week: 1, start_time: '08:00', end_time: '18:00', is_available: true },
  { day_of_week: 2, start_time: '08:00', end_time: '18:00', is_available: true },
  { day_of_week: 3, start_time: '08:00', end_time: '18:00', is_available: true },
  { day_of_week: 4, start_time: '08:00', end_time: '18:00', is_available: true },
  { day_of_week: 5, start_time: '08:00', end_time: '18:00', is_available: true },
  // Saturday morning, 9 AM to 1 PM
  { day_of_week: 6, start_time: '09:00', end_time: '13:00', is_available: true }
];

async function createChiropractor() {
  const client = await pool.connect();
  
  try {
    console.log('🦴 Creating chiropractor doctor record...');
    
    // Insert chiropractor
    const insertDoctorQuery = `
      INSERT INTO doctors (
        first_name, last_name, email, phone_number, specializations,
        license_number, years_experience, education, certifications,
        bio, consultation_fee, rating, total_reviews, is_available, status,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
      ) ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone_number = EXCLUDED.phone_number,
        specializations = EXCLUDED.specializations,
        license_number = EXCLUDED.license_number,
        years_experience = EXCLUDED.years_experience,
        education = EXCLUDED.education,
        certifications = EXCLUDED.certifications,
        bio = EXCLUDED.bio,
        consultation_fee = EXCLUDED.consultation_fee,
        rating = EXCLUDED.rating,
        total_reviews = EXCLUDED.total_reviews,
        is_available = EXCLUDED.is_available,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING id;
    `;
    
    const doctorValues = [
      chiropractorData.first_name,
      chiropractorData.last_name,
      chiropractorData.email,
      chiropractorData.phone_number,
      chiropractorData.specializations,
      chiropractorData.license_number,
      chiropractorData.years_experience,
      chiropractorData.education,
      chiropractorData.certifications,
      chiropractorData.bio,
      chiropractorData.consultation_fee,
      chiropractorData.rating,
      chiropractorData.total_reviews,
      chiropractorData.is_available,
      chiropractorData.status
    ];
    
    const doctorResult = await client.query(insertDoctorQuery, doctorValues);
    const doctorId = doctorResult.rows[0].id;
    
    console.log(`✅ Created/Updated chiropractor: ${chiropractorData.first_name} ${chiropractorData.last_name} (ID: ${doctorId})`);
    
    // Delete existing availability for this doctor
    await client.query('DELETE FROM doctor_availability WHERE doctor_id = $1', [doctorId]);
    
    // Insert new availability
    console.log('🕒 Setting up chiropractor availability...');
    for (const availability of chiropractorAvailability) {
      const availabilityQuery = `
        INSERT INTO doctor_availability (
          doctor_id, day_of_week, start_time, end_time, is_available, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW());
      `;
      
      const availabilityValues = [
        doctorId,
        availability.day_of_week,
        availability.start_time,
        availability.end_time,
        availability.is_available
      ];
      
      await client.query(availabilityQuery, availabilityValues);
    }
    
    console.log('✅ Chiropractor availability set successfully!');
    
    // Display the created record
    const displayQuery = `
      SELECT 
        d.*,
        array_agg(
          json_build_object(
            'day_of_week', da.day_of_week,
            'start_time', da.start_time,
            'end_time', da.end_time,
            'is_available', da.is_available
          ) ORDER BY da.day_of_week
        ) as availability
      FROM doctors d
      LEFT JOIN doctor_availability da ON d.id = da.doctor_id
      WHERE d.id = $1
      GROUP BY d.id;
    `;
    
    const displayResult = await client.query(displayQuery, [doctorId]);
    const doctor = displayResult.rows[0];
    
    console.log('\n🦴 CHIROPRACTOR RECORD CREATED:');
    console.log('=====================================');
    console.log(`ID: ${doctor.id}`);
    console.log(`Name: ${doctor.first_name} ${doctor.last_name}`);
    console.log(`Email: ${doctor.email}`);
    console.log(`Phone: ${doctor.phone_number}`);
    console.log(`License: ${doctor.license_number}`);
    console.log(`Specializations: ${doctor.specializations.join(', ')}`);
    console.log(`Experience: ${doctor.years_experience} years`);
    console.log(`Consultation Fee: $${doctor.consultation_fee}`);
    console.log(`Rating: ${doctor.rating}/5.0 (${doctor.total_reviews} reviews)`);
    console.log(`Status: ${doctor.status}`);
    console.log(`Available: ${doctor.is_available ? 'Yes' : 'No'}`);
    console.log('\nEducation:');
    doctor.education.forEach(edu => console.log(`  - ${edu}`));
    console.log('\nCertifications:');
    doctor.certifications.forEach(cert => console.log(`  - ${cert}`));
    console.log(`\nBio: ${doctor.bio}`);
    console.log('\nAvailability:');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    doctor.availability.forEach(slot => {
      if (slot.day_of_week !== null) {
        console.log(`  ${dayNames[slot.day_of_week]}: ${slot.start_time} - ${slot.end_time}`);
      }
    });
    
    console.log('\n✅ Chiropractor record created successfully!');
    console.log('\n📋 API Endpoints to test:');
    console.log(`GET /appointments/doctors/${doctorId} - Get chiropractor details`);
    console.log(`GET /appointments/doctors?specialization=Chiropractic - Find chiropractors`);
    console.log(`GET /appointments/doctors/search?q=chiropractic - Search chiropractors`);
    
  } catch (error) {
    console.error('❌ Error creating chiropractor:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  createChiropractor();
}

module.exports = createChiropractor; 