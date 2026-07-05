import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt plaintext using AES-256-GCM.
 * @param {string} plaintext - The data to encrypt.
 * @param {Buffer|string} key - 256-bit key (Buffer or hex string).
 * @returns {{ ciphertext: string, iv: string, authTag: string }} Base64-encoded components.
 */
export const encrypt = (plaintext, key) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex');

  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
};

/**
 * Decrypt ciphertext using AES-256-GCM.
 * @param {string} ciphertext - Base64-encoded ciphertext.
 * @param {Buffer|string} key - 256-bit key (Buffer or hex string).
 * @param {string} iv - Base64-encoded initialization vector.
 * @param {string} authTag - Base64-encoded authentication tag.
 * @returns {string} Decrypted plaintext.
 */
export const decrypt = (ciphertext, key, iv, authTag) => {
  const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex');
  const ivBuffer = Buffer.from(iv, 'base64');
  const authTagBuffer = Buffer.from(authTag, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
