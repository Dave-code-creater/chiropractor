const sinon = require('sinon');
const service = require('../src/services/index.service.js');
const profileRepo = require('../src/repositories/profile.repo.js');
const emergencyRepo = require('../src/repositories/emergency.repo.js');
const insuranceRepo = require('../src/repositories/insurance.repo.js');
const { strict: assert } = require('assert');
const { ForbiddenError } = require('../src/utils/httpResponses.js');

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

describe('UserService.update methods', () => {
  afterEach(() => sinon.restore());

  it('updates emergency contact with permission', async () => {
    sinon.stub(emergencyRepo, 'getEmergencyContactById').resolves({ user_id: 5 });
    sinon.stub(emergencyRepo, 'updateEmergencyContact').resolves({ id: 1 });
    const res = await service.updateEmergencyContact(1, {}, { role: 'doctor' });
    assert.equal(res.id, 1);
  });

  it('throws ForbiddenError when updating insurance detail without permission', async () => {
    sinon.stub(insuranceRepo, 'getInsuranceDetailById').resolves({ user_id: 5 });
    try {
      await service.updateInsuranceDetail(1, {}, { role: 'patient', sub: 4 });
      assert.fail('expected error');
    } catch (err) {
      assert.ok(err instanceof ForbiddenError);
    }
  });
});
