import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/index.js';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { generateKeyPair } from '../crypto/kyber.js';
import { encrypt, decrypt } from '../crypto/aes.js';
import { deriveKeyFromMaster } from '../crypto/kdf.js';
import AppError from '../utils/AppError.js';

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
  });
};

const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString('hex');

  const expiryMs = parseExpiry(config.jwt.refreshExpiry);
  const expiresAt = new Date(Date.now() + expiryMs);

  await RefreshToken.create({ token, userId, expiresAt });
  return token;
};

const parseExpiry = (expiry) => {
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 86400000; // default 7 days
  return parseInt(match[1]) * units[match[2]];
};

// Encrypt a Kyber private key for server-side backup
const encryptPrivateKey = (privateKeyBase64, userId) => {
  const derivedKey = deriveKeyFromMaster(
    config.aesMasterKey,
    `kyber-private-key-backup:${userId}`
  );
  return encrypt(privateKeyBase64, derivedKey);
};

// Decrypt the backed-up private key for delivery to an authenticated client
const decryptPrivateKey = (backup, userId) => {
  const derivedKey = deriveKeyFromMaster(
    config.aesMasterKey,
    `kyber-private-key-backup:${userId}`
  );
  return decrypt(backup.ciphertext, derivedKey, backup.iv, backup.authTag);
};

/**
 * Register a new user.
 * Generates Kyber keypair, encrypts and stores the private key backup,
 * returns tokens + the plaintext private key for client-side storage.
 */
export const register = async ({ username, email, password }) => {
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new AppError('User with this email or username already exists', 409);
  }

  // Generate Kyber keypair
  const { publicKey, privateKey } = generateKeyPair();

  // Create user (password hashed via pre-save hook)
  const user = await User.create({
    username,
    email,
    password,
    kyberPublicKey: publicKey,
  });

  // Encrypt and store private key backup
  const encryptedPK = encryptPrivateKey(privateKey, user._id.toString());
  user.kyberKeyBackup = {
    ciphertext: encryptedPK.ciphertext,
    iv: encryptedPK.iv,
    authTag: encryptedPK.authTag,
  };
  await user.save({ validateBeforeSave: false });

  // Generate authentication tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = await generateRefreshToken(user._id);

  return {
    user,
    accessToken,
    refreshToken,
    kyberPrivateKey: privateKey,
  };
};

/**
 * Authenticate a user.
 * Verifies credentials, decrypts the private key backup,
 * and returns tokens + the private key so messages are visible on any device.
 */
export const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select(
    '+password +kyberKeyBackup.ciphertext +kyberKeyBackup.iv +kyberKeyBackup.authTag'
  );

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = await generateRefreshToken(user._id);

  // Recover private key for the client
  let kyberPrivateKey = null;
  if (user.kyberKeyBackup && user.kyberKeyBackup.ciphertext) {
    kyberPrivateKey = decryptPrivateKey(user.kyberKeyBackup, user._id.toString());
  }

  // Update last seen
  user.lastSeen = new Date();
  await user.save({ validateBeforeSave: false });

  return {
    user,
    accessToken,
    refreshToken,
    kyberPrivateKey,
  };
};

/**
 * Rotate tokens: validate the old refresh token, delete it, and issue a new pair.
 */
export const refresh = async (token) => {
  const storedToken = await RefreshToken.findOne({ token });
  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (storedToken.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new AppError('Refresh token expired', 401);
  }

  // Rotate: revoke old, issue new
  await RefreshToken.deleteOne({ _id: storedToken._id });

  const accessToken = generateAccessToken(storedToken.userId);
  const refreshToken = await generateRefreshToken(storedToken.userId);

  return { accessToken, refreshToken };
};

/**
 * Revoke a refresh token on logout.
 */
export const logout = async (token) => {
  const result = await RefreshToken.deleteOne({ token });
  if (result.deletedCount === 0) {
    throw new AppError('Invalid refresh token', 400);
  }
};
