const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../src/index');

describe('🚀 Clinic Performance Tests', () => {
  let authToken = 'mock-token';

  describe('⚡ Response Time Tests', () => {
    it('should respond to health check within 100ms', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).to.be.below(100);
      expect(response.body).to.have.property('success', true);
    });

    it('should handle multiple concurrent health checks', async () => {
      const promises = Array(10).fill().map(() => 
        request(app).get('/health').expect(200)
      );

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(duration).to.be.below(500); // All 10 requests within 500ms
      responses.forEach(response => {
        expect(response.body).to.have.property('success', true);
      });
    });
  });

  describe('📊 Load Testing', () => {
    it('should handle concurrent patient list requests', async () => {
      const concurrentRequests = 5;
      const promises = Array(concurrentRequests).fill().map(() =>
        request(app)
          .get('/v1/api/2025/users/patients')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(duration).to.be.below(2000); // All requests within 2 seconds
      responses.forEach(response => {
        expect(response.status).to.be.oneOf([200, 401, 501]);
      });
    });

    it('should handle concurrent appointment requests', async () => {
      const concurrentRequests = 5;
      const promises = Array(concurrentRequests).fill().map(() =>
        request(app)
          .get('/v1/api/2025/appointments')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(duration).to.be.below(2000);
      responses.forEach(response => {
        expect(response.status).to.be.oneOf([200, 401, 501]);
      });
    });
  });

  describe('🔄 Memory and Resource Tests', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 50 requests
      for (let i = 0; i < 50; i++) {
        await request(app).get('/health').expect(200);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).to.be.below(10 * 1024 * 1024);
    });

    it('should handle large patient data payloads', async () => {
      const largePatientData = {
        firstName: 'John'.repeat(10),
        lastName: 'Doe'.repeat(10),
        email: 'john.doe.large.data@email.com',
        phone: '555-0456',
        dateOfBirth: '1985-06-15',
        gender: 'male',
        address: {
          street: '123 Main St '.repeat(20),
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        },
        medicalHistory: {
          allergies: Array(100).fill('Test Allergy'),
          medications: Array(50).fill('Test Medication'),
          previousSurgeries: Array(20).fill('Test Surgery'),
          chronicConditions: Array(30).fill('Test Condition')
        },
        notes: 'Very long patient notes. '.repeat(1000)
      };

      const start = Date.now();
      const response = await request(app)
        .post('/v1/api/2025/users/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largePatientData);
      
      const duration = Date.now() - start;
      
      expect(duration).to.be.below(1000); // Should handle large payload within 1 second
      expect(response.status).to.be.oneOf([201, 400, 401, 501]);
    });
  });

  describe('🔒 Security Performance', () => {
    it('should quickly reject invalid authentication', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/v1/api/2025/users/patients')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      const duration = Date.now() - start;
      expect(duration).to.be.below(100); // Quick rejection
      expect(response.body).to.have.property('success', false);
    });

    it('should handle multiple failed auth attempts efficiently', async () => {
      const promises = Array(10).fill().map(() =>
        request(app)
          .get('/v1/api/2025/users/patients')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401)
      );

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(duration).to.be.below(500);
      responses.forEach(response => {
        expect(response.body).to.have.property('success', false);
      });
    });
  });

  describe('📈 Scalability Tests', () => {
    it('should maintain performance with multiple route types', async () => {
      const routeTests = [
        () => request(app).get('/health'),
        () => request(app).get('/v1/api/2025/users/patients').set('Authorization', `Bearer ${authToken}`),
        () => request(app).get('/v1/api/2025/appointments').set('Authorization', `Bearer ${authToken}`),
        () => request(app).get('/v1/api/2025/blog/posts'),
        () => request(app).get('/v1/api/2025/reports/clinic-stats').set('Authorization', `Bearer ${authToken}`)
      ];

      const promises = [];
      // Create 20 mixed requests (4 of each type)
      for (let i = 0; i < 4; i++) {
        promises.push(...routeTests.map(test => test()));
      }

      const start = Date.now();
      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(duration).to.be.below(3000); // All 20 mixed requests within 3 seconds
      expect(responses).to.have.length(20);
    });

    it('should handle burst traffic patterns', async () => {
      // Simulate burst traffic: 10 requests, wait, then 10 more
      const burst1 = Array(10).fill().map(() => request(app).get('/health'));
      
      const start1 = Date.now();
      await Promise.all(burst1);
      const duration1 = Date.now() - start1;

      // Wait 100ms
      await new Promise(resolve => setTimeout(resolve, 100));

      const burst2 = Array(10).fill().map(() => request(app).get('/health'));
      
      const start2 = Date.now();
      await Promise.all(burst2);
      const duration2 = Date.now() - start2;

      // Both bursts should complete quickly
      expect(duration1).to.be.below(1000);
      expect(duration2).to.be.below(1000);
    });
  });
}); 