import { createAppointment, getAppointmentById, updateAppointment, listAppointments } from '../repositories/index.repo.js';

export const create = async (req, res) => {
  try {
    const appt = await createAppointment(req.body);
    res.status(201).json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error creating appointment' });
  }
};

export const getById = async (req, res) => {
  try {
    const appt = await getAppointmentById(Number(req.params.id));
    if (!appt) return res.status(404).json({ message: 'not found' });
    res.json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error fetching appointment' });
  }
};

export const update = async (req, res) => {
  try {
    const appt = await updateAppointment(Number(req.params.id), req.body);
    if (!appt) return res.status(404).json({ message: 'not found' });
    res.json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error updating appointment' });
  }
};

export const list = async (req, res) => {
  try {
    const appts = await listAppointments();
    res.json(appts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error listing appointments' });
  }
};
