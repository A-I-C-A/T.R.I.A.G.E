import { Request, Response } from 'express';
import db from '../config/database';
import { generateToken, hashPassword, comparePassword } from '../utils/auth';
import logger from '../utils/logger';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name, role, hospitalId } = req.body;

      const existing = await db('users').where({ email }).first();
      if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const passwordHash = await hashPassword(password);

      const [user] = await db('users')
        .insert({
          email,
          password_hash: passwordHash,
          name,
          role,
          hospital_id: hospitalId,
          is_active: true
        })
        .returning(['id', 'email', 'name', 'role', 'hospital_id']);

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        hospitalId: user.hospital_id
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          hospitalId: user.hospital_id
        },
        token
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await db('users').where({ email, is_active: true }).first();

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await comparePassword(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        hospitalId: user.hospital_id
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          hospitalId: user.hospital_id
        },
        token
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;

      const user = await db('users')
        .where({ id: userId })
        .select('id', 'email', 'name', 'role', 'hospital_id', 'is_active')
        .first();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }
}
