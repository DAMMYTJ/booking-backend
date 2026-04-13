import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../domain/User';
import { UnauthorizedError } from '../../domain/errors/UnauthorizedError';

interface LoginInput {
  email: string;
  password: string;
}

export const loginUser = async (input: LoginInput) => {
  const { email, password } = input;

  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'default_jwt_secret',
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};
