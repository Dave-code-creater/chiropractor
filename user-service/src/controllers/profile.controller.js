import { createProfile, getProfileById, updateProfile } from '../repositories/index.repo.js';

export const create = async (req, res) => {
  try {
    const profile = await createProfile(req.body);
    res.status(201).json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error creating profile' });
  }
};

export const getById = async (req, res) => {
  try {
    const profile = await getProfileById(Number(req.params.id));
    if (!profile) return res.status(404).json({ message: 'not found' });
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error fetching profile' });
  }
};

export const update = async (req, res) => {
  try {
    const profile = await updateProfile(Number(req.params.id), req.body);
    if (!profile) return res.status(404).json({ message: 'not found' });
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error updating profile' });
  }
};
