import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    kyberPublicKey: {
      type: String,
      default: null,
    },
    // Encrypted private key backup for key recovery on new devices.
    // Encrypted using AES_MASTER_KEY + user-specific derivation — server never stores plaintext.
    kyberKeyBackup: {
      ciphertext: { type: String, select: false },
      iv: { type: String, select: false },
      authTag: { type: String, select: false },
    },
    profileImage: {
      type: String,
      default: '',
    },
    dob: {
      type: Date,
      default: null,
    },
    bio: {
      type: String,
      default: 'Hey there! I am using SecureChat.',
      maxlength: [160, 'Bio cannot exceed 160 characters'],
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password instance method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip sensitive fields from JSON serialization
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.kyberKeyBackup;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
