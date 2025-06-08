import { createReport, getReportById, updateReport, listReports } from '../repositories/index.repo.js';

export const create = async (req, res) => {
  try {
    const report = await createReport(req.body.owner_id, req.body.data);
    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error creating report' });
  }
};

export const getById = async (req, res) => {
  try {
    const report = await getReportById(Number(req.params.id));
    if (!report) return res.status(404).json({ message: 'not found' });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error fetching report' });
  }
};

export const update = async (req, res) => {
  try {
    const report = await updateReport(Number(req.params.id), req.body.data);
    if (!report) return res.status(404).json({ message: 'not found' });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error updating report' });
  }
};

export const list = async (req, res) => {
  try {
    const reports = await listReports();
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error listing reports' });
  }
};
