import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername } from '../repositories/index.repo.js';

export const register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'username and password required' });
  }
  try {
    const existing = await findUserByUsername(username);
    if (existing) {
      return res.status(409).json({ message: 'username taken' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await createUser(username, hash);
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error creating user' });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'username and password required' });
  }
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'invalid credentials' });
    }
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'secret');
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'login error' });
  }
};
