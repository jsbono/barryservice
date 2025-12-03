import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AuthPayload } from '../models/types.js';

export function signToken(payload: AuthPayload): string {
  // Use type assertion for expiresIn since jsonwebtoken accepts string values like "7d"
  return jwt.sign(
    payload as object,
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, config.jwt.secret) as AuthPayload;
}
