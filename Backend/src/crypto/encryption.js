import { encrypt, decrypt } from './aes.js';

/**
 * Dual-layer encryption for messages.
 *
 * Layer 1: Encrypt the plaintext message with the message key (AES-256-GCM).
 * Layer 2: Package ciphertext1 + metadata, then encrypt the whole package
 *          with the metadata key (AES-256-GCM).
 *
 * Only the final encrypted blob (ciphertext2) is stored in MongoDB.
 * The database never sees plaintext, sender IDs, receiver IDs, or timestamps.
 */

/**
 * @param {string} plaintext - The raw message text.
 * @param {Buffer} messageKey - 256-bit key for message content encryption.
 * @param {Buffer} metadataKey - 256-bit key for metadata package encryption.
 * @param {Object} metadata - Message metadata.
 * @param {string} metadata.senderId
 * @param {string} metadata.receiverId
 * @param {string} [metadata.timestamp]
 * @param {string} [metadata.messageType='text']
 * @param {string} [metadata.status='sent']
 * @returns {string} JSON-serialized encrypted blob (ciphertext2) for storage.
 */
export const encryptMessage = (plaintext, messageKey, metadataKey, metadata) => {
  // Layer 1: Encrypt the message content
  const layer1 = encrypt(plaintext, messageKey);

  // Build the full package: encrypted content + all metadata
  const messagePackage = {
    ciphertext1: layer1.ciphertext,
    iv1: layer1.iv,
    authTag1: layer1.authTag,
    senderId: metadata.senderId,
    receiverId: metadata.receiverId,
    timestamp: metadata.timestamp || new Date().toISOString(),
    messageType: metadata.messageType || 'text',
    status: metadata.status || 'sent',
  };

  // Layer 2: Encrypt the entire package (hides all metadata)
  const layer2 = encrypt(JSON.stringify(messagePackage), metadataKey);

  // Return the final blob as a single JSON string
  return JSON.stringify({
    ciphertext: layer2.ciphertext,
    iv: layer2.iv,
    authTag: layer2.authTag,
  });
};

/**
 * Dual-layer decryption. Reverses the encryption to recover plaintext + metadata.
 * @param {string} encryptedBlob - JSON-serialized encrypted blob from storage.
 * @param {Buffer} messageKey - 256-bit key for message content decryption.
 * @param {Buffer} metadataKey - 256-bit key for metadata package decryption.
 * @returns {{ plaintext: string, senderId: string, receiverId: string, timestamp: string, messageType: string, status: string }}
 */
export const decryptMessage = (encryptedBlob, messageKey, metadataKey) => {
  const blob = JSON.parse(encryptedBlob);

  // Layer 2: Decrypt the package to reveal metadata + encrypted content
  const packageJson = decrypt(blob.ciphertext, metadataKey, blob.iv, blob.authTag);
  const messagePackage = JSON.parse(packageJson);

  // Layer 1: Decrypt the actual message content
  const plaintext = decrypt(
    messagePackage.ciphertext1,
    messageKey,
    messagePackage.iv1,
    messagePackage.authTag1
  );

  return {
    plaintext,
    senderId: messagePackage.senderId,
    receiverId: messagePackage.receiverId,
    timestamp: messagePackage.timestamp,
    messageType: messagePackage.messageType,
    status: messagePackage.status,
  };
};
