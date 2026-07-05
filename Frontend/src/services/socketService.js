import { io } from 'socket.io-client';
import { store } from '../store/index.js';
import {
  addUserOnline,
  removeUserOffline,
  setOnlineUsers,
  setTypingStatus,
  addMessage,
  updateMessageStatus,
  updateAllMessagesStatus,
  setSharedSecret,
  incrementUnread,
  updateConversationLastMessage,
} from '../store/slices/chatSlice.js';
import { decryptIncomingMessage, getConversationKeys } from './chatService.js';
import {
  encapsulateSecret,
  decapsulateSecret,
  deriveKeys,
  aesEncrypt,
  aesDecrypt,
  bytesToBase64,
  base64ToBytes,
} from '../utils/crypto.js';

let socket = null;

export const initializeSocket = (accessToken) => {
  if (socket) {
    socket.disconnect();
  }

  // Connect to the same origin using a relative path.
  // In development, Vite dev proxy handles the routing; in production, Express handles it directly.
  socket = io('/', {
    auth: {
      token: accessToken,
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('📡 Socket connected');

    // Trigger key requests for conversations that lack shared secrets
    const state = store.getState();
    const conversations = state.chat.conversations;
    const currentUserId = state.auth.user?._id;
    const publicKey = state.auth.user?.kyberPublicKey;

    conversations.forEach((conv) => {
      const secret = state.chat.sharedSecrets[conv._id];
      if (!secret && publicKey) {
        // If we are the creator and missing the secret, ask the recipient
        const partner = conv.participants.find((p) => p._id !== currentUserId);
        if (partner) {
          socket.emit('key:request', {
            conversationId: conv._id,
            requesterId: currentUserId,
            requesterPublicKey: publicKey,
            recipientId: partner._id,
          });
        }
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('📡 Socket disconnected');
  });

  // --- Presence Updates ---

  socket.on('users:online', ({ users }) => {
    store.dispatch(setOnlineUsers(users));
  });

  socket.on('user:online', ({ userId }) => {
    store.dispatch(addUserOnline({ userId }));
  });

  socket.on('user:offline', ({ userId }) => {
    store.dispatch(removeUserOffline({ userId }));
  });

  // --- Real-time Messaging ---

  socket.on('message:receive', async (payload) => {
    const state = store.getState();
    const currentUserId = state.auth.user?._id;
    const conversations = state.chat.conversations;
    const conversation = conversations.find((c) => c._id === payload.conversationId);

    if (conversation) {
      // 1. Decrypt incoming message
      const decryptedMsg = await decryptIncomingMessage(conversation, payload);

      // Ensure the message has a proper _id field mapped from the socket payload
      const msgWithId = {
        ...decryptedMsg,
        _id: decryptedMsg._id || payload.messageId || decryptedMsg.messageId,
      };

      // 2. Dispatch to Redux
      store.dispatch(
        addMessage({
          conversationId: payload.conversationId,
          message: msgWithId,
        })
      );

      // 3. Update sidebar last-message preview
      store.dispatch(
        updateConversationLastMessage({
          conversationId: payload.conversationId,
          text: decryptedMsg.decrypted
            ? decryptedMsg.plaintext
            : '[Encrypted message]',
          timestamp: payload.timestamp || new Date().toISOString(),
          senderId: payload.senderId,
        })
      );

      // 4. Track unread if conversation is NOT currently active
      if (state.chat.activeConversationId !== payload.conversationId) {
        store.dispatch(
          incrementUnread({ conversationId: payload.conversationId })
        );
      }

      // 5. Mark as Delivered (if sender is not us)
      if (payload.senderId !== currentUserId) {
        socket.emit('message:delivered', {
          messageId: payload.messageId,
          senderId: payload.senderId,
        });

        // 6. Mark as Seen if this conversation is active
        if (state.chat.activeConversationId === payload.conversationId) {
          socket.emit('message:seen', {
            messageIds: [payload.messageId],
            senderId: payload.senderId,
            conversationId: payload.conversationId,
          });
        }
      }
    }
  });

  // --- Delivery/Seen Confirmations ---

  socket.on('message:delivered', ({ messageId, deliveredBy }) => {
    const state = store.getState();
    const activeId = state.chat.activeConversationId;
    if (activeId) {
      store.dispatch(
        updateMessageStatus({
          conversationId: activeId,
          messageId,
          status: 'delivered',
        })
      );
    }
  });

  socket.on('message:seen', ({ messageIds, seenBy, conversationId }) => {
    messageIds.forEach((messageId) => {
      store.dispatch(
        updateMessageStatus({
          conversationId,
          messageId,
          status: 'seen',
        })
      );
    });
  });

  // --- Typing Indicators ---

  socket.on('typing:start', ({ userId, conversationId }) => {
    store.dispatch(setTypingStatus({ conversationId, userId, isTyping: true }));
  });

  socket.on('typing:stop', ({ userId, conversationId }) => {
    store.dispatch(setTypingStatus({ conversationId, userId, isTyping: false }));
  });

  socket.on('screenshot:taken', ({ conversationId, userId }) => {
    const state = store.getState();
    const conversations = state.chat.conversations;
    const conversation = conversations.find((c) => c._id === conversationId);

    if (conversation) {
      const partner = conversation.participants.find((p) => p._id === userId);
      const username = partner ? partner.username : 'Someone';

      const systemMessage = {
        _id: `sys-${Date.now()}-${Math.random()}`,
        senderId: 'system',
        plaintext: `"${username}" took a screenshot!`,
        createdAt: new Date().toISOString(),
        isSystem: true,
      };

      store.dispatch(
        addMessage({
          conversationId,
          message: systemMessage,
        })
      );
    }
  });

  // --- E2EE Peer Key Sync Events ---

  socket.on('key:request', async (data) => {
    const { conversationId, requesterId, requesterPublicKey } = data;
    const state = store.getState();
    const currentUserId = state.auth.user?._id;

    // Only respond if we are the correct recipient and have the secret
    const secretBase64 = state.chat.sharedSecrets[conversationId];
    if (secretBase64 && requesterId !== currentUserId) {
      try {
        // Encapsulate requester's Kyber public key to get a temporary secret
        const { ciphertext: tempCiphertext, sharedSecret: tempSharedSecret } =
          encapsulateSecret(requesterPublicKey);

        // Derive AES message/metadata keys from temporary shared secret
        const tempKeys = await deriveKeys(tempSharedSecret);

        // Encrypt the conversation's shared secret using the derived temp key
        const encryptedSecret = await aesEncrypt(secretBase64, tempKeys.messageKey);

        // Send encrypted shared secret back to requester
        socket.emit('key:share', {
          conversationId,
          tempCiphertext,
          encryptedSecret,
          recipientId: requesterId,
        });
        console.log('🔑 [E2EE] Shared conversation key with peer via socket');
      } catch (err) {
        console.error('Failed to share key over socket:', err);
      }
    }
  });

  socket.on('key:share', async (data) => {
    const { conversationId, tempCiphertext, encryptedSecret } = data;
    const state = store.getState();
    const kyberPrivateKey = state.auth.kyberPrivateKey;

    if (kyberPrivateKey) {
      try {
        // Decapsulate the temporary shared secret using our private key
        const tempSharedSecretBytes = decapsulateSecret(tempCiphertext, kyberPrivateKey);

        // Derive keys from the temporary shared secret
        const tempKeys = await deriveKeys(tempSharedSecretBytes);

        // Decrypt the conversation's shared secret
        const recoveredSecretBase64 = await aesDecrypt(
          encryptedSecret.ciphertext,
          tempKeys.messageKey,
          encryptedSecret.iv,
          encryptedSecret.authTag
        );

        // Store the recovered secret
        store.dispatch(
          setSharedSecret({
            conversationId,
            sharedSecret: recoveredSecretBase64,
          })
        );
        console.log('🔑 [E2EE] Recovered conversation key from peer via socket');

        // Re-fetch messages since we now have the keys to decrypt them!
        const conversation = state.chat.conversations.find((c) => c._id === conversationId);
        if (conversation) {
          // Import dynamic thunk to avoid circular dep
          const { fetchMessages } = await import('./chatService.js');
          store.dispatch(fetchMessages(conversation));
        }
      } catch (err) {
        console.error('Failed to process shared key from peer:', err);
      }
    }
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Emit message relay over socket for instant delivery.
 */
export const emitMessageSend = (recipientId, encryptedBlob, conversationId, messageId) => {
  if (socket) {
    socket.emit('message:send', {
      recipientId,
      encryptedBlob,
      conversationId,
      messageId,
    });
  }
};

/**
 * Emit typing status.
 */
export const emitTypingStatus = (recipientId, conversationId, isTyping) => {
  if (socket) {
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
      recipientId,
      conversationId,
    });
  }
};

/**
 * Emit message seen status.
 */
export const emitMessageSeen = (messageIds, senderId, conversationId) => {
  if (socket && messageIds.length > 0) {
    socket.emit('message:seen', {
      messageIds,
      senderId,
      conversationId,
    });
  }
};

/**
 * Emit screenshot notification.
 */
export const emitScreenshotTaken = (recipientId, conversationId) => {
  if (socket) {
    socket.emit('screenshot:taken', {
      recipientId,
      conversationId,
    });
  }
};
