/**
 * Password hashing utility
 * Menggunakan bcryptjs untuk hash password
 */

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash password
 * @param {string} password - Plain password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password
 * @param {string} password - Plain password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate hash untuk seed (sync)
 * @param {string} password - Plain password
 * @returns {string} Hashed password
 */
export function hashPasswordSync(password) {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

