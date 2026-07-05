import { ml_kem1024 } from '@noble/post-quantum/ml-kem.js';

// Base64 to Uint8Array helper
export const base64ToBytes = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Uint8Array to Base64 helper
export const bytesToBase64 = (bytes) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Decapsulate: recover the shared secret using recipient's private key and ciphertext.
 * @param {string} ciphertextBase64 - Base64 Kyber ciphertext.
 * @param {string} privateKeyBase64 - Base64 Kyber private key.
 * @returns {Uint8Array} Shared secret bytes.
 */
export const decapsulateSecret = (ciphertextBase64, privateKeyBase64) => {
  try {
    const ciphertext = base64ToBytes(ciphertextBase64);
    const privateKey = base64ToBytes(privateKeyBase64);
    return ml_kem1024.decapsulate(ciphertext, privateKey);
  } catch (error) {
    console.error('Decapsulation failed:', error);
    throw new Error('Failed to decapsulate Kyber secret');
  }
};

/**
 * Encapsulate: generate a shared secret and ciphertext using recipient's public key.
 * @param {string} publicKeyBase64 - Base64 Kyber public key.
 * @returns {{ ciphertext: string, sharedSecret: Uint8Array }}
 */
export const encapsulateSecret = (publicKeyBase64) => {
  try {
    const publicKey = base64ToBytes(publicKeyBase64);
    const { cipherText, sharedSecret } = ml_kem1024.encapsulate(publicKey);
    return {
      ciphertext: bytesToBase64(cipherText),
      sharedSecret,
    };
  } catch (error) {
    console.error('Encapsulation failed:', error);
    throw new Error('Failed to encapsulate Kyber secret');
  }
};

/**
 * Derive Message and Metadata keys from the Kyber shared secret using HKDF-SHA256.
 * @param {Uint8Array} sharedSecret - The shared secret bytes.
 * @returns {Promise<{ messageKey: CryptoKey, metadataKey: CryptoKey }>}
 */
export const deriveKeys = async (sharedSecret) => {
  try {
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      sharedSecret,
      'HKDF',
      false,
      ['deriveKey']
    );

    // Derive Message Key (AES-GCM-256)
    const messageKey = await window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(0),
        info: new TextEncoder().encode('message-encryption-key'),
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Derive Metadata Key (AES-GCM-256)
    const metadataKey = await window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(0),
        info: new TextEncoder().encode('metadata-encryption-key'),
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    return { messageKey, metadataKey };
  } catch (error) {
    console.error('Key derivation failed:', error);
    throw new Error('Failed to derive encryption keys');
  }
};

/**
 * Encrypt data using AES-GCM-256.
 * @param {string} plaintext - The raw string.
 * @param {CryptoKey} cryptoKey - The derived AES-GCM key.
 * @returns {Promise<{ ciphertext: string, iv: string, authTag: string }>}
 */
export const aesEncrypt = async (plaintext, cryptoKey) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const plaintextBytes = new TextEncoder().encode(plaintext);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    plaintextBytes
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const ciphertextBytes = encryptedBytes.slice(0, -16);
  const authTagBytes = encryptedBytes.slice(-16);

  return {
    ciphertext: bytesToBase64(ciphertextBytes),
    iv: bytesToBase64(iv),
    authTag: bytesToBase64(authTagBytes),
  };
};

/**
 * Decrypt data using AES-GCM-256.
 * @param {string} ciphertext - Base64 ciphertext.
 * @param {CryptoKey} cryptoKey - The derived AES-GCM key.
 * @param {string} iv - Base64 initialization vector.
 * @param {string} authTag - Base64 authentication tag.
 * @returns {Promise<string>} Plaintext string.
 */
export const aesDecrypt = async (ciphertext, cryptoKey, iv, authTag) => {
  const ciphertextBytes = base64ToBytes(ciphertext);
  const ivBytes = base64ToBytes(iv);
  const authTagBytes = base64ToBytes(authTag);

  // Combine ciphertext and authTag for WebCrypto
  const combinedBytes = new Uint8Array(ciphertextBytes.length + authTagBytes.length);
  combinedBytes.set(ciphertextBytes);
  combinedBytes.set(authTagBytes, ciphertextBytes.length);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    cryptoKey,
    combinedBytes
  );

  return new TextDecoder().decode(decryptedBuffer);
};

/**
 * Dual-layer message encryption.
 * Layer 1: Encrypt plaintext message with the message key (AES-256-GCM).
 * Layer 2: Package ciphertext1 + metadata, then encrypt the whole package
 *          with the metadata key (AES-256-GCM).
 */
export const encryptMessageData = async (plaintext, messageKey, metadataKey, metadata) => {
  // Layer 1: Message Content Encryption
  const layer1 = await aesEncrypt(plaintext, messageKey);

  // Package Assembly
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

  // Layer 2: Package Encryption
  const layer2 = await aesEncrypt(JSON.stringify(messagePackage), metadataKey);

  // Return the final blob
  return JSON.stringify({
    ciphertext: layer2.ciphertext,
    iv: layer2.iv,
    authTag: layer2.authTag,
  });
};

/**
 * Dual-layer message decryption.
 */
export const decryptMessageData = async (encryptedBlob, messageKey, metadataKey) => {
  try {
    const blob = JSON.parse(encryptedBlob);

    // Layer 2: Decrypt package
    const packageJson = await aesDecrypt(blob.ciphertext, metadataKey, blob.iv, blob.authTag);
    const messagePackage = JSON.parse(packageJson);

    // Layer 1: Decrypt message content
    const plaintext = await aesDecrypt(
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
  } catch (error) {
    console.error('Decryption orchestrator failed:', error);
    throw new Error('Decryption failed. Check key validity.');
  }
};
