import { createSlice } from '@reduxjs/toolkit';

// Load initial secrets from localStorage
const loadSecrets = () => {
  try {
    const secrets = localStorage.getItem('conversation_secrets');
    return secrets ? JSON.parse(secrets) : {};
  } catch {
    return {};
  }
};

// Load unread counts from localStorage
const loadUnreadCounts = () => {
  try {
    const counts = localStorage.getItem('unread_counts');
    return counts ? JSON.parse(counts) : {};
  } catch {
    return {};
  }
};

const saveUnreadCounts = (counts) => {
  localStorage.setItem('unread_counts', JSON.stringify(counts));
};

// Load last-read timestamps per conversation from localStorage
const loadLastReadTimestamps = () => {
  try {
    const data = localStorage.getItem('last_read_timestamps');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveLastReadTimestamps = (timestamps) => {
  localStorage.setItem('last_read_timestamps', JSON.stringify(timestamps));
};

const initialState = {
  conversations: [],
  messages: {}, // conversationId -> Array of decrypted messages
  sharedSecrets: loadSecrets(), // conversationId -> base64 string
  activeConversationId: null,
  onlineUsers: [], // Array of userIds
  typingUsers: {}, // conversationId -> Array of userIds
  unreadCounts: loadUnreadCounts(), // conversationId -> number
  lastReadTimestamps: loadLastReadTimestamps(), // conversationId -> ISO string
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    updateConversation: (state, action) => {
      const updated = action.payload;
      const index = state.conversations.findIndex((c) => c._id === updated._id);
      if (index !== -1) {
        state.conversations[index] = { ...state.conversations[index], ...updated };
      } else {
        state.conversations.unshift(updated);
      }
      // Re-sort conversations by most recent activity
      state.conversations.sort((a, b) => {
        const timeA = a.lastMessageTimestamp || a.updatedAt;
        const timeB = b.lastMessageTimestamp || b.updatedAt;
        return new Date(timeB) - new Date(timeA);
      });
    },
    setMessages: (state, action) => {
      const { conversationId, messages } = action.payload;
      state.messages[conversationId] = messages;
    },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      // Check for duplicates (e.g. self messages sent via socket vs api)
      const exists = state.messages[conversationId].some((m) => m._id === message._id);
      if (!exists) {
        state.messages[conversationId].push(message);
      }
    },
    setSharedSecret: (state, action) => {
      const { conversationId, sharedSecret } = action.payload;
      state.sharedSecrets[conversationId] = sharedSecret;
      localStorage.setItem('conversation_secrets', JSON.stringify(state.sharedSecrets));
    },
    setActiveConversationId: (state, action) => {
      state.activeConversationId = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    addUserOnline: (state, action) => {
      const { userId } = action.payload;
      if (!state.onlineUsers.includes(userId)) {
        state.onlineUsers.push(userId);
      }
    },
    removeUserOffline: (state, action) => {
      const { userId } = action.payload;
      state.onlineUsers = state.onlineUsers.filter((id) => id !== userId);
    },
    setTypingStatus: (state, action) => {
      const { conversationId, userId, isTyping } = action.payload;
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      if (isTyping) {
        if (!state.typingUsers[conversationId].includes(userId)) {
          state.typingUsers[conversationId].push(userId);
        }
      } else {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
          (id) => id !== userId
        );
      }
    },
    updateMessageStatus: (state, action) => {
      const { conversationId, messageId, status } = action.payload;
      const msgs = state.messages[conversationId];
      if (msgs) {
        const msg = msgs.find((m) => m._id === messageId);
        if (msg) {
          msg.status = status;
        }
      }
    },
    updateAllMessagesStatus: (state, action) => {
      const { conversationId, status, excludeUserId } = action.payload;
      const msgs = state.messages[conversationId];
      if (msgs) {
        msgs.forEach((m) => {
          if (m.senderId !== excludeUserId) {
            m.status = status;
          }
        });
      }
    },

    // --- Unread count management ---

    incrementUnread: (state, action) => {
      const { conversationId } = action.payload;
      state.unreadCounts[conversationId] = (state.unreadCounts[conversationId] || 0) + 1;
      saveUnreadCounts(state.unreadCounts);
    },
    setUnreadCount: (state, action) => {
      const { conversationId, count } = action.payload;
      state.unreadCounts[conversationId] = count;
      saveUnreadCounts(state.unreadCounts);
    },
    clearUnread: (state, action) => {
      const { conversationId } = action.payload;
      state.unreadCounts[conversationId] = 0;
      saveUnreadCounts(state.unreadCounts);
    },

    // --- Last-read timestamp management ---

    updateLastReadTimestamp: (state, action) => {
      const { conversationId, timestamp } = action.payload;
      state.lastReadTimestamps[conversationId] = timestamp || new Date().toISOString();
      saveLastReadTimestamps(state.lastReadTimestamps);
    },

    // --- Last message preview for sidebar ---

    updateConversationLastMessage: (state, action) => {
      const { conversationId, text, timestamp, senderId } = action.payload;
      const index = state.conversations.findIndex((c) => c._id === conversationId);
      if (index !== -1) {
        state.conversations[index].lastMessagePreview = text;
        state.conversations[index].lastMessageTimestamp = timestamp;
        state.conversations[index].lastMessageSenderId = senderId;
      }
      // Re-sort so most recent conversation floats to the top
      state.conversations.sort((a, b) => {
        const timeA = a.lastMessageTimestamp || a.updatedAt;
        const timeB = b.lastMessageTimestamp || b.updatedAt;
        return new Date(timeB) - new Date(timeA);
      });
    },

    clearChat: (state) => {
      state.conversations = [];
      state.messages = {};
      state.sharedSecrets = {};
      state.activeConversationId = null;
      state.onlineUsers = [];
      state.typingUsers = {};
      state.unreadCounts = {};
      state.lastReadTimestamps = {};
      state.error = null;
      localStorage.removeItem('conversation_secrets');
      localStorage.removeItem('unread_counts');
      localStorage.removeItem('last_read_timestamps');
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setConversations,
  updateConversation,
  setMessages,
  addMessage,
  setSharedSecret,
  setActiveConversationId,
  setOnlineUsers,
  addUserOnline,
  removeUserOffline,
  setTypingStatus,
  updateMessageStatus,
  updateAllMessagesStatus,
  incrementUnread,
  setUnreadCount,
  clearUnread,
  updateLastReadTimestamp,
  updateConversationLastMessage,
  clearChat,
  setLoading,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;
