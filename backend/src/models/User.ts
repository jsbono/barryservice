import { query, queryOne, execute } from '../config/db.js';
import { User } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export function findById(id: string): User | null {
  return queryOne<User>('SELECT * FROM users WHERE id = ?', [id]);
}

export function findByEmail(email: string): User | null {
  return queryOne<User>('SELECT * FROM users WHERE email = ?', [email]);
}

export function create(email: string, passwordHash: string, role = 'mechanic'): User {
  const id = uuidv4();
  const now = new Date().toISOString();
  execute(
    `INSERT INTO users (id, email, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, email, passwordHash, role, now]
  );
  return findById(id)!;
}
