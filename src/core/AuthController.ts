import * as argon from 'argon2';
import { config } from 'dotenv';
import * as jwt from 'jsonwebtoken';
import Stripe from 'stripe';

import { prisma } from '../db';
import { sendEmail } from '../services/email';
import { PASSWORD_RESET_EXPIRY, WEB_URL } from '../utils/constants';

config();

const stripe = new Stripe(process.env.STRIPE_API_KEY, {
  apiVersion: '2020-08-27',
});

export const login = async (
  _parent: any,
  args: any,
  _context: any,
  _info: any,
): Promise<any> => {
  try {
    const { email, password } = args.input;

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error(`Email isn't associated with an account`);
    }

    const valid = await argon.verify(user.password, password);

    if (!valid) {
      throw new Error('Incorrect Password');
    }

    return {
      token: jwt.sign(
        {
          userId: user.id,
          expiresIn: 24 * 60 * 60,
          iss: process.env.API_URL,
        },
        process.env.JWT_SECRET,
      ),
      user,
    };
  } catch (error) {
    return error;
  }
};

export const register = async (
  _parent: any,
  args: any,
  _context: any,
  _info: any,
): Promise<any> => {
  try {
    const { email, firstName, lastName, password } = args.input;

    const encryptedPassword = await argon.hash(password);

    const normalizedUser = {
      firstName,
      lastName,
      email: email?.toLowerCase()?.trim(),
      password: encryptedPassword,
    };

    const customer = await stripe.customers.create({
      name: `${normalizedUser.firstName} ${normalizedUser.lastName}`,
      email: normalizedUser.email,
    });

    const emailVerificationToken: string = jwt.sign(
      {
        iss: process.env.API_URL,
      },
      process.env.JWT_SECRET,
    );

    const user = await prisma.user.create({
      data: {
        email: normalizedUser.email,
        firstName: normalizedUser.firstName,
        lastName: normalizedUser.lastName,
        password: normalizedUser.password,
        stripeCustomerId: customer.id,
        emailVerificationToken,
      },
    });

    await sendEmail({
      type: 'confirmEmail',
      emails: [normalizedUser.email],
      url: `${WEB_URL}/verify-password/${emailVerificationToken}`,
    });

    return {
      token: jwt.sign(
        {
          userId: user.id,
          expiresIn: 24 * 60 * 60,
          iss: process.env.API_URL,
        },
        process.env.JWT_SECRET,
      ),
      user,
    };
  } catch (error) {
    return error;
  }
};

export const getCurrentUser = async (
  _parent: any,
  _args: any,
  context: any,
  _info: any,
): Promise<any> => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: context?.user?.id,
      },
    });
    return user;
  } catch (error) {
    return error;
  }
};

export const authRequest = async (req: any): Promise<any> => {
  try {
    const authHeader: any = req.headers.authorization;

    if (!authHeader) {
      throw new Error('No token');
    }

    const token: any = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token');
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      throw new Error('Invalid token');
    }

    // 24 Hours
    const expireAt = decoded.iat + 24 * 60 * 60;
    const currentTime = new Date().getSeconds();
    if (currentTime >= expireAt) {
      throw new Error('Expired token');
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    return error;
  }
};

export const resendEmailVerification = async (
  _parent: any,
  args: any,
  _context: any,
  _info: any,
): Promise<any> => {
  try {
    const { email } = args.input;

    const emailVerificationToken: string = jwt.sign(
      {
        iss: process.env.API_URL,
      },
      process.env.JWT_SECRET,
    );

    await prisma.user.update({
      where: {
        email,
      },
      data: {
        emailVerificationToken,
      },
    });

    return { success: true };
  } catch (error) {
    return error;
  }
};

export const verifyResetPasswordToken = async (
  _parent: any,
  args: any,
  _context: any,
  _info: any,
): Promise<any> => {
  try {
    const { token } = args.input;

    const user = await prisma.user.findUnique({
      where: {
        passwordResetToken: token,
      },
    });

    if (!user) {
      throw new Error(`User not found`);
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      throw new Error('Invalid token');
    }

    // 24 Hours
    const expireAt = decoded.iat + 24 * 60 * 60;
    const currentTime = new Date().getSeconds();
    if (currentTime >= expireAt) {
      throw new Error('Token has expired');
    }

    return {
      success: true,
    };
  } catch (error) {
    return error;
  }
};

export const forgotPassword = async (
  _parent: any,
  args: any,
  _context: any,
  _info: any,
): Promise<any> => {
  console.log(args.input.email);
  const email = args.input.email;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email?.toLowerCase(),
      },
    });

    if (user.email.toLowerCase() !== email?.toLowerCase() || !user) {
      throw new Error('User not found.');
    }

    const passwordResetRequestedAt = new Date();
    const passwordResetToken = jwt.sign(
      {
        userId: user.id,
        expiresIn: PASSWORD_RESET_EXPIRY,
        iss: process.env.API_URL,
      },
      process.env.JWT_SECRET,
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetToken,
        passwordResetRequestedAt,
      },
    });

    // Email User
    sendEmail({
      type: 'forgotPassword',
      emails: [user.email],
      url: `${WEB_URL}/reset-password/${passwordResetToken}`,
    });

    return { success: true };
  } catch (error) {
    return error;
  }
};

export const resetPassword = async (
  _parent: any,
  args: any,
  _context: any,
  _info: any,
): Promise<any> => {
  const { password, token } = args.input;

  try {
    if (!password) {
      throw new Error('Password is required');
    }
    if (!token) {
      throw new Error('Token is required');
    }

    // Find User By Token
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user) {
      throw new Error('Invalid token');
    }

    // Validate Token Expiry
    const requestedAt = new Date(user.passwordResetRequestedAt).getTime();
    const expirationTime = requestedAt + PASSWORD_RESET_EXPIRY;

    if (Date.now() > expirationTime) {
      throw new Error('Password reset token has expired');
    }

    // Prepare Password
    const encryptedPassword = await argon.hash(password);

    // Save User
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: encryptedPassword,
        passwordResetRequestedAt: null,
        passwordResetToken: null,
      },
    });

    return { success: true };
  } catch (error) {
    return error;
  }
};
