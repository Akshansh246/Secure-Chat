import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    // Only the double-encrypted blob is stored — no plaintext, no readable metadata
    encryptedBlob: {
      type: String,
      required: [true, 'Encrypted message blob is required'],
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for paginated message fetching
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Automatically delete messages after 24 hours (86400 seconds)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
