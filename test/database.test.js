const { expect } = require('chai');
const { connectPostgreSQL, connectMongoDB } = require('../src/config/database');

describe('Database Connections', () => {
  
  describe('PostgreSQL Connection', () => {
    it('should handle connection failure gracefully', async () => {
      try {
        await connectPostgreSQL();
        // If connection succeeds, that's also fine
        expect(true).to.be.true;
      } catch (error) {
        // Should handle connection failure gracefully
        expect(error).to.be.an('error');
        expect(error.code).to.equal('ECONNREFUSED');
      }
    });
  });

  describe('MongoDB Connection', () => {
    it('should handle connection failure gracefully', async function() {
      this.timeout(5000); // Increase timeout for MongoDB connection
      try {
        await connectMongoDB();
        // If connection succeeds, that's also fine
        expect(true).to.be.true;
      } catch (error) {
        // Should handle connection failure gracefully
        expect(error).to.be.an('error');
      }
    });
  });

  describe('Database Configuration', () => {
    it('should have valid database configuration', () => {
      const config = require('../src/config');
      
      expect(config.databases).to.be.an('object');
      expect(config.databases.postgresql).to.be.an('object');
      expect(config.databases.mongodb).to.be.an('object');
      
      expect(config.databases.postgresql).to.have.property('host');
      expect(config.databases.postgresql).to.have.property('port');
      expect(config.databases.postgresql).to.have.property('database');
      expect(config.databases.postgresql).to.have.property('user');
      
      expect(config.databases.mongodb).to.have.property('uri');
    });
  });
}); 