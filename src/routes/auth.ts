import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
    body('role').isIn(['admin', 'doctor', 'nurse', 'staff', 'government']),
    validate
  ],
  AuthController.register
);

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
    validate
  ],
  AuthController.login
);

router.get('/profile', authenticate, AuthController.getProfile);

export default router;
