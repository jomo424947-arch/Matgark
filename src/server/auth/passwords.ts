import crypto from "node:crypto"

/**
 * Secure password hashing using Node.js built-in scrypt
 * Produces a format: `${saltHex}:${derivedKeyHex}`
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return `${salt}:${derivedKey.toString("hex")}`
}

/**
 * Constant-time verification of password against stored hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false
  const [salt, key] = storedHash.split(":")
  if (!salt || !key) return false

  const keyBuffer = Buffer.from(key, "hex")
  const derivedKey = crypto.scryptSync(password, salt, 64)

  if (keyBuffer.length !== derivedKey.length) return false
  return crypto.timingSafeEqual(keyBuffer, derivedKey)
}
