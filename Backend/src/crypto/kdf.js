import crypto from 'crypto';

const HASH = 'sha256';
const KEY_LENGTH = 32; // 256 bits for AES-256

/**
 * Derive message and metadata encryption keys from a Kyber shared secret.
 * Uses HKDF with distinct info strings to produce independent keys.
 * @param {Buffer|string} sharedSecret - Kyber shared secret (Buffer or hex string).
 * @param {string} info - Optional context prefix for domain separation.
 * @returns {{ messageKey: Buffer, metadataKey: Buffer }}
 */
export const deriveKeys = (sharedSecret, info = '') => {
  const secretBuffer = Buffer.isBuffer(sharedSecret)
    ? sharedSecret
    : Buffer.from(sharedSecret, 'hex');

  const messageKey = Buffer.from(
    crypto.hkdfSync(
      HASH,
      secretBuffer,
      Buffer.alloc(0),
      `${info}message-encryption-key`,
      KEY_LENGTH
    )
  );

  const metadataKey = Buffer.from(
    crypto.hkdfSync(
      HASH,
      secretBuffer,
      Buffer.alloc(0),
      `${info}metadata-encryption-key`,
      KEY_LENGTH
    )
  );

  return { messageKey, metadataKey };
};

/**
 * Derive a single key from the server's AES master key for a specific context.
 * Used for encrypting private key backups.
 * @param {string} masterKey - Hex-encoded master key from environment.
 * @param {string} context - Context string for domain separation (e.g., userId).
 * @returns {Buffer} 256-bit derived key.
 */
export const deriveKeyFromMaster = (masterKey, context) => {
  const masterBuffer = Buffer.isBuffer(masterKey)
    ? masterKey
    : Buffer.from(masterKey, 'hex');

  return Buffer.from(
    crypto.hkdfSync(HASH, masterBuffer, Buffer.alloc(0), context, KEY_LENGTH)
  );
};
