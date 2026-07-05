import { ml_kem1024 } from '@noble/post-quantum/ml-kem.js';

/**
 * Generate a CRYSTALS-Kyber (ML-KEM-1024) keypair.
 * ML-KEM-1024 provides the highest security level (NIST Level 5).
 * @returns {{ publicKey: string, privateKey: string }} Base64-encoded keys.
 */
export const generateKeyPair = () => {
  const { publicKey, secretKey } = ml_kem1024.keygen();

  return {
    publicKey: Buffer.from(publicKey).toString('base64'),
    privateKey: Buffer.from(secretKey).toString('base64'),
  };
};

/**
 * Encapsulate: generate a shared secret using the recipient's public key.
 * Called by the sender during key exchange.
 * @param {string} publicKeyBase64 - Recipient's Base64-encoded public key.
 * @returns {{ ciphertext: string, sharedSecret: Buffer }}
 */
export const encapsulate = (publicKeyBase64) => {
  const publicKey = new Uint8Array(Buffer.from(publicKeyBase64, 'base64'));
  const { cipherText, sharedSecret } = ml_kem1024.encapsulate(publicKey);

  return {
    ciphertext: Buffer.from(cipherText).toString('base64'),
    sharedSecret: Buffer.from(sharedSecret),
  };
};

/**
 * Decapsulate: recover the shared secret from a ciphertext using the private key.
 * Called by the recipient to derive the same shared secret.
 * @param {string} ciphertextBase64 - Base64-encoded Kyber ciphertext.
 * @param {string} privateKeyBase64 - Recipient's Base64-encoded private key.
 * @returns {Buffer} The shared secret.
 */
export const decapsulate = (ciphertextBase64, privateKeyBase64) => {
  const ciphertext = new Uint8Array(Buffer.from(ciphertextBase64, 'base64'));
  const privateKey = new Uint8Array(Buffer.from(privateKeyBase64, 'base64'));
  const sharedSecret = ml_kem1024.decapsulate(ciphertext, privateKey);

  return Buffer.from(sharedSecret);
};
