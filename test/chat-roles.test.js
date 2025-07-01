const request = require('supertest');
const app = require('../src/index');

describe('Role-Based Chat System', () => {
  let patientToken, doctorToken, staffToken, adminToken;
  let patientUserId, doctorUserId, anotherPatientUserId;

  beforeAll(async () => {
    // These would be set up with actual login tokens in a real test
    // For now, this demonstrates the expected behavior
  });

  describe('Patient Chat Restrictions', () => {
    test('Patient can start conversation with doctor', async () => {
      const response = await request(app)
        .post('/v1/api/2025/chat/conversations')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          target_user_id: doctorUserId,
          subject: 'Medical Question',
          conversation_type: 'consultation'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('Patient cannot start conversation with another patient', async () => {
      const response = await request(app)
        .post('/v1/api/2025/chat/conversations')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          target_user_id: anotherPatientUserId,
          subject: 'Patient Question',
          conversation_type: 'general'
        });

      expect(response.status).toBe(403);
      expect(response.body.error_code).toBe('4031');
      expect(response.body.message).toContain('Patients cannot start conversations with other patients');
    });

    test('Patient can get available users (doctors, staff, admin only)', async () => {
      const response = await request(app)
        .get('/v1/api/2025/chat/available-users')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.allowed_roles).toEqual(['doctor', 'staff', 'admin']);
      
      // Verify no patients in the available users list
      const patientUsers = response.body.data.users.filter(user => user.role === 'patient');
      expect(patientUsers.length).toBe(0);
    });
  });

  describe('Doctor Chat Permissions', () => {
    test('Doctor can start conversation with patient', async () => {
      const response = await request(app)
        .post('/v1/api/2025/chat/conversations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          target_user_id: patientUserId,
          subject: 'Follow-up',
          conversation_type: 'consultation'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('Doctor can get available users (all roles)', async () => {
      const response = await request(app)
        .get('/v1/api/2025/chat/available-users')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.allowed_roles).toEqual(['patient', 'doctor', 'staff', 'admin']);
    });
  });

  describe('Admin Chat Permissions', () => {
    test('Admin can start conversation with anyone', async () => {
      const response = await request(app)
        .post('/v1/api/2025/chat/conversations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          target_user_id: patientUserId,
          subject: 'Administrative Notice',
          conversation_type: 'general'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('Admin has no role restrictions', async () => {
      const response = await request(app)
        .get('/v1/api/2025/chat/available-users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.allowed_roles).toEqual(['patient', 'doctor', 'staff', 'admin']);
    });
  });

  describe('Conversation Security', () => {
    test('User cannot access conversation they are not participant in', async () => {
      // This would test that users can only see conversations they're part of
      // Implementation depends on how conversation IDs are managed
    });

    test('Only authorized roles can close conversations', async () => {
      // This would test that only doctors, staff, and admin can close conversations
      // Patients should not be able to close conversations
    });
  });
});

module.exports = {
  testChatRoleRestrictions: true
}; 