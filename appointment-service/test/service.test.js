const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const { expect } = chai;
const AppointmentService = require('../src/services/index.service.js');
const apptRepo = require('../src/repositories/appointment.repo.js');
const noteRepo = require('../src/repositories/note.repo.js');

describe('AppointmentService methods', () => {
  afterEach(() => chai.spy.restore());

  it('creates appointment via repo', async () => {
    const createSpy = chai.spy.on(apptRepo, 'createAppointment', () =>
      Promise.resolve({ id: 1 })
    );
    const result = await AppointmentService.createAppointment({ patient_id: 1 });
    expect(createSpy).to.have.been.called.with({ patient_id: 1 });
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

  it('creates note via repo', async () => {
    const createSpy = chai.spy.on(noteRepo, 'createTreatmentNote', () =>
      Promise.resolve({ id: 10 })
    );
    const result = await AppointmentService.createNote({ appointment_id: 7 });
    expect(createSpy).to.have.been.called.with({ appointment_id: 7 });
    expect(result).to.deep.equal({ id: 10 });
  });

  it('gets note via repo', async () => {
    const getSpy = chai.spy.on(noteRepo, 'getTreatmentNoteById', () =>
      Promise.resolve({ id: 11 })
    );
    const result = await AppointmentService.getNote(11);
    expect(getSpy).to.have.been.called.with(11);
    expect(result).to.deep.equal({ id: 11 });
  });

  it('updates note via repo', async () => {
    const updateSpy = chai.spy.on(noteRepo, 'updateTreatmentNote', () =>
      Promise.resolve({ id: 12 })
    );
    const result = await AppointmentService.updateNote(12, { content: 'a' });
    expect(updateSpy).to.have.been.called.with(12, { content: 'a' });
    expect(result).to.deep.equal({ id: 12 });
  });
});
