const sinon = require('sinon');
const service = require('../src/services/index.service.js');
const profileRepo = require('../src/repositories/profile.repo.js');
const emergencyRepo = require('../src/repositories/emergency.repo.js');
const insuranceRepo = require('../src/repositories/insurance.repo.js');
const painRepo = require('../src/repositories/pain.repo.js');
const { strict: assert } = require('assert');
const { ForbiddenError } = require('../src/utils/httpResponses.js');

describe('UserService.createProfile', () => {
  afterEach(() => sinon.restore());

  it('creates related records with userId from header', async () => {
    const req = {
      headers: { 'user-id': '5' },
      body: {
        home_addr: 'x',
        city: 'y',
        zip: 'z',
        home_phone: '123',
        emergency_contact: { name: 'a', phone: '1' },
        insurance_detail: { insurance_type: 'text' },
        pain_descriptions: [{ type_id: 1 }]
      }
    };
    sinon.stub(profileRepo, 'createProfile').resolves({ user_id: 5 });
    sinon.stub(emergencyRepo, 'createEmergencyContact').resolves({ user_id: 5 });
    sinon.stub(insuranceRepo, 'createInsuranceDetail').resolves({ user_id: 5 });
    sinon.stub(painRepo, 'createPainDescription').resolves({ id: 1, user_id: 5 });

    const result = await service.createProfile(req);
    assert.equal(result.profile.user_id, 5);
    assert.ok(profileRepo.createProfile.calledOnce);
    assert.ok(emergencyRepo.createEmergencyContact.calledOnce);
    assert.ok(insuranceRepo.createInsuranceDetail.calledOnce);
    assert.ok(painRepo.createPainDescription.calledOnce);
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
