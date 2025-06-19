const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const { expect } = chai;
const AppointmentService = require('../src/services/index.service.js');
const apptRepo = require('../src/repositories/appointment.repo.js');
const authClient = require('../src/services/auth.service.js');
const broker = require('../src/utils/messageBroker.js');

describe('AppointmentService methods', () => {
  beforeEach(() => {
    chai.spy.on(broker, 'publish', () => Promise.resolve());
  });
  afterEach(() => chai.spy.restore());

  it('creates appointment via repo', async () => {
    const createSpy = chai.spy.on(apptRepo, 'createAppointment', () =>
      Promise.resolve({ id: 1 })
    );
    const authSpy = chai.spy.on(authClient, 'getUser', () => Promise.resolve({ id: 1 }));
    const result = await AppointmentService.createAppointment({ patient_id: 1, doctor_id: 1 });
    expect(createSpy).to.have.been.called.with({ patient_id: 1, doctor_id: 1 });
    expect(authSpy).to.have.been.called.with(1);
    expect(result).to.deep.equal({ id: 1 });
  });

  it('gets appointment via repo', async () => {
    const getSpy = chai.spy.on(apptRepo, 'getAppointmentById', () =>
      Promise.resolve({ id: 2 })
    );
    const result = await AppointmentService.getAppointment(2);
    expect(getSpy).to.have.been.called.with(2);
    expect(result).to.deep.equal({ id: 2 });
  });

  it('updates appointment via repo', async () => {
    const updateSpy = chai.spy.on(apptRepo, 'updateAppointment', () =>
      Promise.resolve({ id: 3 })
    );
    const result = await AppointmentService.updateAppointment(3, { patient_id: 5 });
    expect(updateSpy).to.have.been.called.with(3, { patient_id: 5 });
    expect(result).to.deep.equal({ id: 3 });
  });

  it('lists appointments via repo', async () => {
    const listSpy = chai.spy.on(apptRepo, 'listAppointments', () => Promise.resolve([]));
    const result = await AppointmentService.listAppointments();
    expect(listSpy).to.have.been.called();
    expect(result).to.deep.equal([]);
  });

  it('lists appointments by doctor via repo', async () => {
    const listSpy = chai.spy.on(apptRepo, 'listAppointmentsByDoctor', () => Promise.resolve([]));
    const result = await AppointmentService.listAppointmentsByDoctor(1);
    expect(listSpy).to.have.been.called.with(1);
    expect(result).to.deep.equal([]);
  });

  it('deletes appointment via repo', async () => {
    const delSpy = chai.spy.on(apptRepo, 'deleteAppointment', () =>
      Promise.resolve({ id: 5 })
    );
    const result = await AppointmentService.deleteAppointment(5);
    expect(delSpy).to.have.been.called.with(5);
    expect(result).to.deep.equal({ id: 5 });
  });

  
});
