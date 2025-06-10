const sinon = require('sinon');
const { expect } = require('chai');
const ProfileService = require('../src/services/profile.service.js');
const EmergencyService = require('../src/services/emergency.service.js');
const InsuranceService = require('../src/services/insurance.service.js');
    const result = await ProfileService.create(req);
    expect(emergencyRepo.createEmergencyContact.calledOnce).to.be.true;
    expect(insuranceRepo.createInsuranceDetail.calledOnce).to.be.true;
    expect(painRepo.createPainDescription.calledOnce).to.be.true;
    const res = await EmergencyService.update(1, {}, { role: 'doctor' });
      await InsuranceService.update(1, {}, { role: 'patient', sub: 4 });
      expect(err).to.be.instanceOf(ForbiddenError);
before(() => {
  process.env.JWT_SECRET = 'testsecret';
  process.env.JWT_EXPIRES_IN = '15m';
  loadEnv();
});

beforeEach(async () => {
  const db = getDb();
  await db.deleteFrom('treatment_goals').execute();
  await db.deleteFrom('pain_descriptions').execute();
  await db.deleteFrom('home_exercises').execute();
  await db.deleteFrom('history_accident').execute();
  await db.deleteFrom('pain_chart').execute();
  await db.deleteFrom('complaint_locations').execute();
  await db.deleteFrom('chief_complaint').execute();
  await db.deleteFrom('insurance_details').execute();
  await db.deleteFrom('preliminary_info').execute();
  await db.deleteFrom('emergency_contacts').execute();
  await db.deleteFrom('profiles').execute();
});

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

    expect(result.profile.user_id).to.equal(5);
    expect(profileRepo.createProfile.calledOnce).to.be.true;
    expect(emergencyRepo.createEmergencyContact.calledOnce).to.be.true;
    expect(insuranceRepo.createInsuranceDetail.calledOnce).to.be.true;
    expect(painRepo.createPainDescription.calledOnce).to.be.true;
  });
});

describe('UserService.update methods', () => {
  afterEach(() => sinon.restore());

  it('updates emergency contact with permission', async () => {
    sinon.stub(emergencyRepo, 'getEmergencyContactById').resolves({ user_id: 5 });
    sinon.stub(emergencyRepo, 'updateEmergencyContact').resolves({ id: 1 });

    const res = await service.updateEmergencyContact(1, {}, { role: 'doctor' });

    expect(res.id).to.equal(1);
  });

  it('throws ForbiddenError when updating insurance detail without permission', async () => {
    sinon.stub(insuranceRepo, 'getInsuranceDetailById').resolves({ user_id: 5 });

    try {
      await service.updateInsuranceDetail(1, {}, { role: 'patient', sub: 4 });
      throw new Error('Should have thrown ForbiddenError');
    } catch (err) {
      expect(err).to.be.instanceOf(ForbiddenError);
    }
  });
});