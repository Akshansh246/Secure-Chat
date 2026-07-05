import socketAuth from './socketAuth.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

// Track online users: userId → Set<socketId>
// Supports multiple connections per user (e.g., phone + desktop)
const onlineUsers = new Map();

const getRecipientSocketIds = (userId) => {
  return onlineUsers.get(userId) || new Set();
};

/**
 * Initialize Socket.IO with authentication and event handlers.
 * Handles: presence tracking, message relay, delivery/seen status, typing indicators.
 */
const initializeSocket = (io) => {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`⚡ User connected: ${userId} (socket: ${socket.id})`);

    // --- Presence Tracking ---

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast that this user is online
    socket.broadcast.emit('user:online', { userId });

    // Send the full list of currently online users to the newly connected client
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('users:online', { users: onlineUserIds });

    // --- Message Relay ---

    socket.on('message:send', (data) => {
      const { recipientId, encryptedBlob, conversationId, messageId } = data;
      const recipientSockets = getRecipientSocketIds(recipientId);

      const payload = {
        senderId: userId,
        encryptedBlob,
        conversationId,
        messageId,
        timestamp: new Date().toISOString(),
      };

      // Deliver to all of the recipient's connected sockets
      for (const socketId of recipientSockets) {
        io.to(socketId).emit('message:receive', payload);
      }

      // Acknowledge to the sender that the message was relayed
      socket.emit('message:sent', {
        messageId,
        timestamp: payload.timestamp,
      });
    });

    // --- Delivery Status ---

    socket.on('message:delivered', async (data) => {
      const { messageId, senderId } = data;

      try {
        // Mark message as delivered only if it is not already seen
        await Message.updateOne(
          { _id: messageId, status: { $ne: 'seen' } },
          { status: 'delivered' }
        );
      } catch (err) {
        console.error('Failed to update message status to delivered in DB:', err);
      }

      const senderSockets = getRecipientSocketIds(senderId);
      for (const socketId of senderSockets) {
        io.to(socketId).emit('message:delivered', {
          messageId,
          deliveredBy: userId,
        });
      }
    });

    // --- Seen Status ---

    socket.on('message:seen', async (data) => {
      const { messageIds, senderId, conversationId } = data;

      try {
        // Bulk update messages in the list to seen status
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { status: 'seen' }
        );
      } catch (err) {
        console.error('Failed to update message status to seen in DB:', err);
      }

      const senderSockets = getRecipientSocketIds(senderId);
      for (const socketId of senderSockets) {
        io.to(socketId).emit('message:seen', {
          messageIds,
          seenBy: userId,
          conversationId,
        });
      }
    });

    // --- Typing Indicators ---

    socket.on('typing:start', (data) => {
      const { recipientId, conversationId } = data;
      const recipientSockets = getRecipientSocketIds(recipientId);

      for (const socketId of recipientSockets) {
        io.to(socketId).emit('typing:start', {
          userId,
          conversationId,
        });
      }
    });

    socket.on('typing:stop', (data) => {
      const { recipientId, conversationId } = data;
      const recipientSockets = getRecipientSocketIds(recipientId);

      for (const socketId of recipientSockets) {
        io.to(socketId).emit('typing:stop', {
          userId,
          conversationId,
        });
      }
    });

    socket.on('screenshot:taken', (data) => {
      const { recipientId, conversationId } = data;
      const recipientSockets = getRecipientSocketIds(recipientId);

      for (const socketId of recipientSockets) {
        io.to(socketId).emit('screenshot:taken', {
          userId,
          conversationId,
        });
      }
    });

    // --- E2EE Peer Key Sync Relay ---

    socket.on('key:request', (data) => {
      const { recipientId, conversationId, requesterId, requesterPublicKey } = data;
      const recipientSockets = getRecipientSocketIds(recipientId);

      for (const socketId of recipientSockets) {
        io.to(socketId).emit('key:request', {
          conversationId,
          requesterId,
          requesterPublicKey,
        });
      }
    });

    socket.on('key:share', (data) => {
      const { recipientId, conversationId, tempCiphertext, encryptedSecret } = data;
      const recipientSockets = getRecipientSocketIds(recipientId);

      for (const socketId of recipientSockets) {
        io.to(socketId).emit('key:share', {
          conversationId,
          tempCiphertext,
          encryptedSecret,
        });
      }
    });

    // --- Disconnection ---

    socket.on('disconnect', async () => {
      console.log(`💤 User disconnected: ${userId} (socket: ${socket.id})`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);

        // Only mark offline when ALL sockets for this user are closed
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          // Update last seen in the database
          await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

          // Broadcast offline status to all connected clients
          socket.broadcast.emit('user:offline', {
            userId,
            lastSeen: new Date().toISOString(),
          });
        }
      }
    });
  });
};

export default initializeSocket;
