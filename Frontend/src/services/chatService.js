import api from './api.js';
import { store } from '../store/index.js';
import {
  setConversations,
  updateConversation,
  setMessages,
  addMessage,
  setSharedSecret,
  setLoading,
  setError,
  setUnreadCount,
  updateConversationLastMessage,
} from '../store/slices/chatSlice.js';
import {
  encapsulateSecret,
  decapsulateSecret,
  deriveKeys,
  encryptMessageData,
  decryptMessageData,
  bytesToBase64,
  base64ToBytes,
} from '../utils/crypto.js';

// Cache of derived CryptoKey instances: conversationId -> { messageKey, metadataKey }
const derivedCryptoKeysCache = new Map();

/**
 * Invalidate the cached CryptoKey for a conversation.
 * Called when a shared secret is updated so keys are re-derived on next use.
 */
export const invalidateKeyCache = (conversationId) => {
  derivedCryptoKeysCache.delete(conversationId);
};

/**
 * Get or derive encryption keys for a conversation.
 *
 * Resolution order:
 *  1. In-memory CryptoKey cache
 *  2. Redux / localStorage shared secret → derive
 *  3. Decapsulate the conversation's kyberCiphertext (non-initiator only)
 *  4. Throw — caller must trigger socket key-sync
 */
export const getConversationKeys = async (conversation) => {
  const conversationId = conversation._id;

  // 1. Check in-memory key cache
  if (derivedCryptoKeysCache.has(conversationId)) {
    return derivedCryptoKeysCache.get(conversationId);
  }

  // 2. Check Redux/LocalStorage shared secrets
  const state = store.getState();
  let sharedSecretBase64 = state.chat.sharedSecrets[conversationId];

  // 3. If missing, attempt to decapsulate Kyber ciphertext using user's private key
  if (!sharedSecretBase64 && conversation.kyberCiphertext) {
    const currentUserId = state.auth.user?._id;

    // The initiator generated the ciphertext using the RECIPIENT's public key,
    // so only the RECIPIENT can decapsulate it.
    // Handle both raw ObjectId string and populated object forms of `initiator`.
    const initiatorId = conversation.initiator?._id || conversation.initiator;
    const isInitiator =
      initiatorId && currentUserId
        ? String(initiatorId) === String(currentUserId)
        : false;

    console.log('🔑 [E2EE getConversationKeys]', {
      conversationId,
      initiator: initiatorId,
      currentUserId,
      isInitiator,
      hasKyberCiphertext: !!conversation.kyberCiphertext,
      hasPrivateKey: !!state.auth.kyberPrivateKey,
    });

    if (!isInitiator) {
      const privateKeyBase64 = state.auth.kyberPrivateKey;
      if (privateKeyBase64) {
        try {
          const sharedSecretBytes = decapsulateSecret(
            conversation.kyberCiphertext,
            privateKeyBase64
          );
          sharedSecretBase64 = bytesToBase64(sharedSecretBytes);
          // Persist for future use
          store.dispatch(
            setSharedSecret({ conversationId, sharedSecret: sharedSecretBase64 })
          );
          console.log('🔑 [E2EE] Decapsulated shared secret successfully');
        } catch (err) {
          console.warn('🔑 [E2EE] Could not decapsulate Kyber ciphertext.', err);
        }
      }
    } else {
      console.log(
        '🔑 [E2EE] We are the initiator and lost the secret. Waiting for socket key-sync.'
      );
    }
  }

  if (!sharedSecretBase64) {
    throw new Error('Key exchange not complete. Waiting for keys to sync...');
  }

  // 4. Derive CryptoKey objects and cache them
  const sharedSecretBytes = base64ToBytes(sharedSecretBase64);
  const keys = await deriveKeys(sharedSecretBytes);
  derivedCryptoKeysCache.set(conversationId, keys);

  // Debug: log key fingerprint so both participants can verify they match
  try {
    const raw = await window.crypto.subtle.exportKey('raw', keys.messageKey);
    const hash = await window.crypto.subtle.digest('SHA-256', raw);
    console.log(
      '🔑 [E2EE] Derived key fingerprint:',
      bytesToBase64(new Uint8Array(hash)).substring(0, 12)
    );
  } catch {
    /* non-critical */
  }

  return keys;
};

/**
 * Fetch a user's Kyber public key.
 */
export const fetchUserPublicKey = async (userId) => {
  const response = await api.get(`/keys/${userId}`);
  return response.data.data.publicKey;
};

/**
 * Search users by username/email.
 */
export const searchUsers = async (query) => {
  const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
  return response.data.data.users;
};

/**
 * Fetch conversations, warm up key caches, and calculate initial unread counts.
 */
export const fetchConversations = () => async (dispatch, getState) => {
  dispatch(setLoading(true));
  try {
    const response = await api.get('/conversations');
    const conversations = response.data.data.conversations;

    dispatch(setConversations(conversations));

    // Warm up the key cache for each conversation
    for (const conv of conversations) {
      try {
        await getConversationKeys(conv);
      } catch (e) {
        // Safe to ignore key warmup failures here, they will be handled when chat opens
      }
    }

    // Calculate initial unread indicators for conversations with messages
    // received while we were offline (based on lastReadTimestamps).
    const lastReadTimestamps = getState().chat.lastReadTimestamps;
    for (const conv of conversations) {
      const existingUnread = getState().chat.unreadCounts[conv._id];
      if (!existingUnread && conv.lastMessage?.timestamp) {
        const lastRead = lastReadTimestamps[conv._id];
        if (
          !lastRead ||
          new Date(conv.lastMessage.timestamp) > new Date(lastRead)
        ) {
          // Mark at least 1 unread so the badge is visible
          dispatch(setUnreadCount({ conversationId: conv._id, count: 1 }));
        }
      }
    }
  } catch (error) {
    dispatch(
      setError(error.response?.data?.message || 'Failed to fetch conversations')
    );
  } finally {
    dispatch(setLoading(false));
  }
};

/**
 * Start (or resume) a conversation.
 *
 * CRITICAL FIX: If the conversation already exists locally with a shared
 * secret, reuse it — never re-encapsulate, which would create a key mismatch.
 */
export const startConversation =
  (participantId) => async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();

      // ── Fast path: conversation already exists locally with keys ──
      const localExisting = state.chat.conversations.find((c) =>
        c.participants.some((p) => {
          const pid = typeof p === 'object' ? p._id : p;
          return pid === participantId;
        })
      );

      if (localExisting && state.chat.sharedSecrets[localExisting._id]) {
        // Already have conversation + keys, nothing to do
        return localExisting;
      }

      // ── Slow path: need to contact the server ──

      // 1. Fetch participant's Kyber public key
      const pubKey = await fetchUserPublicKey(participantId);

      // 2. Perform ML-KEM-1024 encapsulation
      const { ciphertext, sharedSecret } = encapsulateSecret(pubKey);

      // 3. Register conversation on server
      const response = await api.post('/conversations', {
        participantId,
        kyberCiphertext: ciphertext,
      });
      const conversation = response.data.data.conversation;

      // 4. Determine if the server used OUR ciphertext or kept an existing one.
      //    If the server returned a DIFFERENT ciphertext, the conversation
      //    already existed — our new shared secret is useless.
      const serverUsedOurCiphertext =
        conversation.kyberCiphertext === ciphertext;

      if (serverUsedOurCiphertext) {
        // We are the initiator of this key exchange — persist our shared secret
        const sharedSecretBase64 = bytesToBase64(sharedSecret);
        dispatch(
          setSharedSecret({
            conversationId: conversation._id,
            sharedSecret: sharedSecretBase64,
          })
        );
        console.log('🔑 [E2EE] Stored shared secret as conversation initiator');
      } else {
        // Server kept an older ciphertext. Try to derive keys from it
        // (possible if we're the non-initiator and can decapsulate).
        try {
          await getConversationKeys(conversation);
          console.log(
            '🔑 [E2EE] Derived keys from existing conversation ciphertext'
          );
        } catch (e) {
          console.log(
            '🔑 [E2EE] Existing conversation found — key sync needed via socket'
          );
        }
      }

      dispatch(updateConversation(conversation));
      return conversation;
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to start conversation';
      dispatch(setError(message));
      throw new Error(message);
    } finally {
      dispatch(setLoading(false));
    }
  };

/**
 * Fetch and decrypt messages for a conversation.
 */
export const fetchMessages = (conversation) => async (dispatch, getState) => {
  const conversationId = conversation._id;
  const currentUserId = getState().auth.user?._id;

  try {
    const response = await api.get(`/messages/${conversationId}`);
    const { messages } = response.data.data;

    let keys;
    try {
      keys = await getConversationKeys(conversation);
    } catch (keyErr) {
      // If we don't have keys yet, save the encrypted messages anyway
      const encryptedMessages = messages.map((msg) => ({
        ...msg,
        plaintext: '[Encrypted — key not synced yet]',
        decrypted: false,
      }));
      dispatch(setMessages({ conversationId, messages: encryptedMessages }));
      return;
    }

    // Decrypt messages
    const decryptedMessages = [];
    for (const msg of messages) {
      try {
        const decrypted = await decryptMessageData(
          msg.encryptedBlob,
          keys.messageKey,
          keys.metadataKey
        );
        decryptedMessages.push({
          ...msg,
          ...decrypted,
          decrypted: true,
        });
      } catch (decErr) {
        decryptedMessages.push({
          ...msg,
          plaintext: '[Decryption Error]',
          senderId: 'unknown',
          receiverId: 'unknown',
          timestamp: msg.createdAt,
          messageType: 'text',
          status: 'sent',
          decrypted: false,
        });
      }
    }

    // Sort messages chronologically (oldest to newest for rendering)
    decryptedMessages.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    dispatch(setMessages({ conversationId, messages: decryptedMessages }));

    // Update sidebar last-message preview from the most recent message
    if (decryptedMessages.length > 0) {
      const last = decryptedMessages[decryptedMessages.length - 1];
      dispatch(
        updateConversationLastMessage({
          conversationId,
          text: last.decrypted ? last.plaintext : '[Encrypted]',
          timestamp: last.createdAt || last.timestamp,
          senderId: last.senderId,
        })
      );
    }
  } catch (error) {
    dispatch(
      setError(error.response?.data?.message || 'Failed to fetch messages')
    );
  }
};

/**
 * Encrypt and send a message.
 */
export const sendChatMessage =
  (conversation, text) => async (dispatch, getState) => {
    const conversationId = conversation._id;
    const currentUser = getState().auth.user;
    const receiverId = conversation.participants.find(
      (p) => p._id !== currentUser._id
    )?._id;

    try {
      const keys = await getConversationKeys(conversation);

      // 1. Dual-layer encrypt message client-side
      const encryptedBlob = await encryptMessageData(
        text,
        keys.messageKey,
        keys.metadataKey,
        {
          senderId: currentUser._id,
          receiverId,
          messageType: 'text',
          status: 'sent',
        }
      );

      // 2. Post encrypted blob to backend
      const response = await api.post('/messages', {
        encryptedBlob,
        conversationId,
      });

      const serverMsg = response.data.data.message;

      // 3. Add local message to Redux (plaintext is available locally)
      const localMsg = {
        ...serverMsg,
        plaintext: text,
        senderId: currentUser._id,
        receiverId,
        messageType: 'text',
        status: 'sent',
        timestamp: serverMsg.createdAt,
        decrypted: true,
      };

      dispatch(addMessage({ conversationId, message: localMsg }));

      // 4. Update sidebar last-message preview
      dispatch(
        updateConversationLastMessage({
          conversationId,
          text,
          timestamp: serverMsg.createdAt,
          senderId: currentUser._id,
        })
      );

      return localMsg;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

/**
 * Handle decrypting a single incoming message from Socket.IO.
 */
export const decryptIncomingMessage = async (conversation, msg) => {
  try {
    const keys = await getConversationKeys(conversation);
    const decrypted = await decryptMessageData(
      msg.encryptedBlob,
      keys.messageKey,
      keys.metadataKey
    );
    return {
      ...msg,
      ...decrypted,
      decrypted: true,
    };
  } catch (error) {
    return {
      ...msg,
      plaintext: '[Encrypted message]',
      decrypted: false,
    };
  }
};
