import { Router, Request, Response, NextFunction } from 'express';
import { registerUser } from '../../../use-cases/auth/RegisterUser';
import { loginUser } from '../../../use-cases/auth/LoginUser';

const router = Router();

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email and password are required' });
      return;
    }
    const result = await registerUser({ name, email, password });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }
    const result = await loginUser({ email, password });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
