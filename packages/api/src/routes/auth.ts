import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { config } from '../config/index.js';

const router = Router();

// Create Supabase admin client for auth operations
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Validation schemas
const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().min(6, 'Token is required'),
  type: z.enum(['magiclink', 'email']).default('magiclink'),
});

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'technician', 'user']).default('user'),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updatePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * POST /auth/magic-link - Send magic link for passwordless login
 */
router.post('/magic-link', asyncHandler(async (req: Request, res: Response) => {
  const { email } = emailSchema.parse(req.body);

  const { error } = await supabaseAdmin.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${req.headers.origin || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    console.error('Magic link error:', error);
    throw ApiError.internal('Failed to send magic link');
  }

  res.json({
    message: 'Magic link sent to your email',
    data: { email },
  });
}));

/**
 * POST /auth/verify-otp - Verify OTP/magic link token
 */
router.post('/verify-otp', asyncHandler(async (req: Request, res: Response) => {
  const { email, token, type } = verifyOtpSchema.parse(req.body);

  const { data, error } = await supabaseAdmin.auth.verifyOtp({
    email,
    token,
    type: type === 'magiclink' ? 'magiclink' : 'email',
  });

  if (error) {
    console.error('OTP verification error:', error);
    throw ApiError.unauthorized('Invalid or expired token');
  }

  res.json({
    message: 'Successfully verified',
    data: {
      user: data.user,
      session: data.session,
    },
  });
}));

/**
 * POST /auth/sign-up - Register a new user
 */
router.post('/sign-up', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, first_name, last_name, role } = signUpSchema.parse(req.body);

  // If no password provided, send magic link instead
  if (!password) {
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${req.headers.origin || 'http://localhost:3000'}/auth/callback`,
        data: {
          first_name,
          last_name,
          role,
        },
      },
    });

    if (error) {
      console.error('Sign up magic link error:', error);
      throw ApiError.internal('Failed to send verification email');
    }

    res.status(201).json({
      message: 'Verification email sent',
      data: { email },
    });
    return;
  }

  // Create user with password
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for API-created users
    user_metadata: {
      first_name,
      last_name,
      role,
    },
  });

  if (error) {
    console.error('Sign up error:', error);
    if (error.message.includes('already registered')) {
      throw ApiError.conflict('Email already registered');
    }
    throw ApiError.internal('Failed to create user');
  }

  res.status(201).json({
    message: 'User created successfully',
    data: {
      user: {
        id: data.user.id,
        email: data.user.email,
        first_name,
        last_name,
        role,
      },
    },
  });
}));

/**
 * POST /auth/sign-in - Sign in with email and password
 */
router.post('/sign-in', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = signInSchema.parse(req.body);

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error);
    throw ApiError.unauthorized('Invalid email or password');
  }

  res.json({
    message: 'Successfully signed in',
    data: {
      user: data.user,
      session: data.session,
    },
  });
}));

/**
 * POST /auth/sign-out - Sign out current user
 */
router.post('/sign-out', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (token) {
    // Sign out the user
    const { error } = await supabaseAdmin.auth.admin.signOut(token);

    if (error) {
      console.error('Sign out error:', error);
      // Don't throw, just log - user might already be signed out
    }
  }

  res.json({ message: 'Successfully signed out' });
}));

/**
 * POST /auth/refresh - Refresh session token
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refresh_token } = z.object({
    refresh_token: z.string().min(1),
  }).parse(req.body);

  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token,
  });

  if (error) {
    console.error('Refresh token error:', error);
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  res.json({
    message: 'Session refreshed',
    data: {
      session: data.session,
      user: data.user,
    },
  });
}));

/**
 * GET /auth/me - Get current user info
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  res.json({
    data: {
      id: req.user.id,
      email: req.user.email,
      first_name: req.user.user_metadata?.first_name,
      last_name: req.user.user_metadata?.last_name,
      role: req.user.user_metadata?.role || 'user',
      created_at: req.user.created_at,
      last_sign_in_at: req.user.last_sign_in_at,
    },
  });
}));

/**
 * PATCH /auth/me - Update current user profile
 */
router.patch('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { first_name, last_name } = z.object({
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
  }).parse(req.body);

  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    req.user.id,
    {
      user_metadata: {
        ...req.user.user_metadata,
        first_name: first_name ?? req.user.user_metadata?.first_name,
        last_name: last_name ?? req.user.user_metadata?.last_name,
      },
    }
  );

  if (error) {
    console.error('Update user error:', error);
    throw ApiError.internal('Failed to update profile');
  }

  res.json({
    message: 'Profile updated',
    data: {
      id: data.user.id,
      email: data.user.email,
      first_name: data.user.user_metadata?.first_name,
      last_name: data.user.user_metadata?.last_name,
      role: data.user.user_metadata?.role || 'user',
    },
  });
}));

/**
 * POST /auth/change-password - Change password for authenticated user
 */
router.post('/change-password', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { current_password, new_password } = updatePasswordSchema.parse(req.body);

  if (!req.user) {
    throw ApiError.unauthorized();
  }

  // Verify current password by attempting to sign in
  const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
    email: req.user.email!,
    password: current_password,
  });

  if (verifyError) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  // Update to new password
  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    req.user.id,
    { password: new_password }
  );

  if (error) {
    console.error('Change password error:', error);
    throw ApiError.internal('Failed to change password');
  }

  res.json({ message: 'Password changed successfully' });
}));

/**
 * POST /auth/forgot-password - Send password reset email
 */
router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { email } = resetPasswordSchema.parse(req.body);

  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${req.headers.origin || 'http://localhost:3000'}/auth/reset-password`,
  });

  if (error) {
    console.error('Forgot password error:', error);
    // Don't reveal if email exists or not
  }

  // Always return success to prevent email enumeration
  res.json({
    message: 'If an account exists with this email, a password reset link will be sent',
  });
}));

/**
 * POST /auth/reset-password - Reset password with token
 */
router.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  const { token, new_password } = z.object({
    token: z.string().min(1),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
  }).parse(req.body);

  // Verify the recovery token and update password
  const { data, error } = await supabaseAdmin.auth.verifyOtp({
    token_hash: token,
    type: 'recovery',
  });

  if (error || !data.user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  // Update the password
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    data.user.id,
    { password: new_password }
  );

  if (updateError) {
    throw ApiError.internal('Failed to reset password');
  }

  res.json({ message: 'Password reset successfully' });
}));

/**
 * GET /auth/session - Validate current session
 */
router.get('/session', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.json({
      data: {
        authenticated: false,
        user: null,
      },
    });
    return;
  }

  res.json({
    data: {
      authenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        first_name: req.user.user_metadata?.first_name,
        last_name: req.user.user_metadata?.last_name,
        role: req.user.user_metadata?.role || 'user',
      },
    },
  });
}));

export default router;
