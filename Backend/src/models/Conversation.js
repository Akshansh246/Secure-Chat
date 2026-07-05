import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    // Kyber ciphertext exchanged between participants for deriving shared secrets
    kyberCiphertext: {
      type: String,
      default: null,
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastMessage: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null,
      },
      timestamp: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
