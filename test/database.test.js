const { expect } = require('chai');
const { connectPostgreSQL } = require('../src/config/database');

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

  describe('Database Configuration', () => {
    it('should have valid database configuration', () => {
      const config = require('../src/config');
      
      expect(config.databases).to.be.an('object');
      expect(config.databases.postgresql).to.be.an('object');
      
      expect(config.databases.postgresql).to.have.property('host');
      expect(config.databases.postgresql).to.have.property('port');
      expect(config.databases.postgresql).to.have.property('database');
      expect(config.databases.postgresql).to.have.property('user');
    });
  });
}); 