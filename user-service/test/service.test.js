const sinon = require('sinon');
const service = require('../src/services/index.service.js');
const profileRepo = require('../src/repositories/profile.repo.js');
const emergencyRepo = require('../src/repositories/emergency.repo.js');
const insuranceRepo = require('../src/repositories/insurance.repo.js');
const { strict: assert } = require('assert');

describe('UserService.createProfile', () => {
  afterEach(() => sinon.restore());

  it('creates related records with userId from header', async () => {
    const req = { headers: { 'user-id': '5' }, body: { home_addr: 'x' } };
    sinon.stub(profileRepo, 'createProfile').resolves({ user_id: 5 });
    sinon.stub(emergencyRepo, 'createEmergencyContact').resolves({ user_id: 5 });
    sinon.stub(insuranceRepo, 'createInsuranceDetail').resolves({ user_id: 5 });

    const result = await service.createProfile(req);
    assert.equal(result.profile.user_id, 5);
    assert.ok(profileRepo.createProfile.calledOnce);
    assert.ok(emergencyRepo.createEmergencyContact.calledOnce);
    assert.ok(insuranceRepo.createInsuranceDetail.calledOnce);
  });
});
