import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Shield,
  Search,
  Send,
  LogOut,
  User as UserIcon,
  Circle,
  Clock,
  Check,
  CheckCheck,
  Loader2,
  Lock,
  Menu,
  X,
} from 'lucide-react';
import { logoutUser, checkAuth } from '../services/authService.js';
import {
  fetchConversations,
  startConversation,
  fetchMessages,
  sendChatMessage,
  searchUsers,
} from '../services/chatService.js';
import {
  initializeSocket,
  disconnectSocket,
  emitTypingStatus,
  emitMessageSeen,
  emitMessageSend,
  getSocket,
} from '../services/socketService.js';
import { setActiveConversationId, clearUnread, updateLastReadTimestamp } from '../store/slices/chatSlice.js';
import logo from '../assets/logo.svg';

const Dashboard = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const { user: currentUser, accessToken, kyberPrivateKey } = useSelector((state) => state.auth);
  const {
    conversations,
    messages,
    activeConversationId,
    onlineUsers,
    typingUsers,
    sharedSecrets,
    unreadCounts,
    loading,
  } = useSelector((state) => state.chat);

  // Component States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeConversationIdRef = useRef(activeConversationId);

  // Keep activeConversationIdRef updated for socket closures
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // 1. Initialize Auth Check, Fetch Conversations, and Socket.IO
  useEffect(() => {
    dispatch(checkAuth());
    dispatch(fetchConversations());

    if (accessToken) {
      initializeSocket(accessToken);
    }

    return () => {
      disconnectSocket();
    };
  }, [dispatch, accessToken]);

  // 1.5. Trigger E2EE peer key synchronization when conversations load or update
  useEffect(() => {
    const socketClient = getSocket();
    if (socketClient && conversations.length > 0 && currentUser?.kyberPublicKey) {
      conversations.forEach((conv) => {
        const secret = sharedSecrets[conv._id];
        if (!secret) {
          const partner = conv.participants.find((p) => p._id !== currentUser._id);
          if (partner) {
            socketClient.emit('key:request', {
              conversationId: conv._id,
              requesterId: currentUser._id,
              requesterPublicKey: currentUser.kyberPublicKey,
              recipientId: partner._id,
            });
          }
        }
      });
    }
  }, [conversations, sharedSecrets, currentUser]);

  // Find the active conversation object
  const activeConversation = conversations.find((c) => c._id === activeConversationId);

  // Find partner details
  const getPartner = (conv) => {
    return conv.participants.find((p) => p._id !== currentUser?._id);
  };

  // Check if partner is online
  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  // 2. Fetch Messages, clear unread, and handle Seen emit when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      // Clear unread count and update last-read timestamp
      dispatch(clearUnread({ conversationId: activeConversationId }));
      dispatch(updateLastReadTimestamp({ conversationId: activeConversationId }));

      dispatch(fetchMessages(activeConversation));

      // Emit seen status for unread messages
      const convMessages = messages[activeConversationId] || [];
      const unseenMessageIds = convMessages
        .filter((m) => m.senderId !== currentUser?._id && m.status !== 'seen')
        .map((m) => m._id);

      if (unseenMessageIds.length > 0) {
        const partner = getPartner(activeConversation);
        if (partner) {
          emitMessageSeen(unseenMessageIds, partner._id, activeConversationId);
        }
      }
    }
  }, [activeConversationId, dispatch]);

  // 3. Scroll to bottom of message list on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversationId]);

  // 4. Handle User Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearching(true);
        try {
          const results = await searchUsers(searchQuery);
          setSearchResults(results);
        } catch (err) {
          console.error(err);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Start new conversation
  const handleSelectUser = async (userId) => {
    setSearchQuery('');
    setSearchResults([]);
    try {
      const conv = await dispatch(startConversation(userId));
      dispatch(setActiveConversationId(conv._id));
      dispatch(clearUnread({ conversationId: conv._id }));
      dispatch(updateLastReadTimestamp({ conversationId: conv._id }));
      setMobileMenuOpen(false);
    } catch (err) {
      alert('Failed to start secure conversation: ' + err.message);
    }
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;

    const textToSend = messageText.trim();
    setMessageText('');

    // Stop typing indicator immediately
    handleTyping(false);

    try {
      const partner = getPartner(activeConversation);
      const sentMsg = await dispatch(sendChatMessage(activeConversation, textToSend));

      // Relay via Socket.IO for instant delivery
      emitMessageSend(partner._id, sentMsg.encryptedBlob, activeConversationId, sentMsg._id);
    } catch (err) {
      alert('Message encryption/dispatch failed: ' + err.message);
    }
  };

  // Handle Typing indicator triggers
  const handleTyping = (typingState) => {
    if (!activeConversation) return;
    const partner = getPartner(activeConversation);
    if (!partner) return;

    setIsTyping(typingState);
    emitTypingStatus(partner._id, activeConversationId, typingState);
  };

  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    if (!isTyping) {
      handleTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to lock your secure keychain?')) {
      dispatch(logoutUser());
    }
  };

  // Format dates helper
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (dateStr) => {
    if (!dateStr) return 'Offline';
    const date = new Date(dateStr);
    return `Last seen ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <div className="h-screen bg-surface-container-lowest text-on-surface flex flex-col font-sans selection:bg-primary/30 selection:text-primary overflow-hidden relative grid-bg">
      
      {/* Mobile Header */}
      <header className="md:hidden border-b border-outline-variant/30 h-16 flex items-center justify-between px-4 bg-surface/80 backdrop-blur-md z-40">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer">
          {mobileMenuOpen ? <X className="h-5 w-5 text-on-surface" /> : <Menu className="h-5 w-5 text-on-surface" />}
        </button>
        <Link to="/" className="flex items-center">
          <img src={logo} alt="SecureChat Logo" className="h-8 w-auto" />
        </Link>
        <button onClick={handleLogout} className="p-2 hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer">
          <LogOut className="h-4 w-4 text-on-surface-variant hover:text-primary" />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar */}
        <aside
          className={`${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-200 ease-in-out absolute md:relative z-30 w-80 h-full border-r border-outline-variant/30 bg-surface flex flex-col flex-shrink-0`}
        >
          {/* User Profile Header */}
          <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/20">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center font-code font-bold text-sm text-primary uppercase shadow-inner">
                {currentUser?.username?.substring(0, 2)}
              </div>
              <div>
                <span className="font-headline font-semibold text-sm block text-white">{currentUser?.username}</span>
                <span className="text-[10px] text-on-surface-variant flex items-center space-x-1.5 font-code">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
                  <span>Secure Core Online</span>
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="hidden md:flex p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-primary transition-all cursor-pointer border border-transparent hover:border-outline-variant/30"
              title="Lock Secure Keychain"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Search Contacts */}
          <div className="p-4 border-b border-outline-variant/30 relative bg-surface-container-lowest/30">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant/60" />
              <input
                type="text"
                placeholder="Search username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-surface-container-highest/50 border border-outline-variant/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg font-code text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none transition-all duration-200"
              />
              {searching && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* User Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-4 right-4 mt-2 bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto glass-panel p-1">
                <div className="p-2 border-b border-outline-variant/30 text-[10px] text-on-surface-variant/60 tracking-widest font-code font-bold uppercase">
                  MATCHING KEYCHAINS
                </div>
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleSelectUser(user._id)}
                    className="w-full p-2.5 flex items-center space-x-3 hover:bg-surface-container-highest rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center font-code text-xs font-semibold text-white">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{user.username}</div>
                      <div className="text-[10px] text-on-surface-variant/60 font-code">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-3 pt-2.5 pb-1 text-[10px] text-on-surface-variant/50 tracking-wider font-code font-bold uppercase">
              SECURE CHANNELS
            </div>

            {conversations.length === 0 && !loading && (
              <div className="p-6 text-center text-xs text-on-surface-variant/40 font-code mt-8 leading-relaxed">
                No active secure channels.<br />Start a search to establish a keyset.
              </div>
            )}

            {conversations.map((conv) => {
              const partner = getPartner(conv);
              const isActive = conv._id === activeConversationId;
              const isPartnerOnline = isUserOnline(partner?._id);
              const hasKey = !!sharedSecrets[conv._id];
              const unreadCount = unreadCounts[conv._id] || 0;

              // Build the subtitle line
              let subtitle;
              if (conv.lastMessagePreview) {
                const prefix =
                  conv.lastMessageSenderId === currentUser?._id ? 'You: ' : '';
                subtitle = prefix + conv.lastMessagePreview;
              } else if (!hasKey) {
                subtitle = null;
              } else {
                subtitle = 'Secured channel';
              }

              return (
                <button
                  key={conv._id}
                  onClick={() => {
                    dispatch(setActiveConversationId(conv._id));
                    dispatch(clearUnread({ conversationId: conv._id }));
                    dispatch(updateLastReadTimestamp({ conversationId: conv._id }));
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 flex items-center justify-between rounded-xl transition-all text-left cursor-pointer border ${
                    isActive 
                      ? 'bg-surface-container-high/60 border-primary/30 glow-effect' 
                      : 'hover:bg-surface-container-low/40 border-transparent hover:border-outline-variant/20'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="h-9 w-9 rounded-lg bg-surface-container-highest border border-outline-variant/40 flex items-center justify-center font-code font-semibold text-xs text-on-surface uppercase">
                        {partner?.username?.substring(0, 2)}
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-surface flex items-center justify-center ${
                          isPartnerOnline ? 'bg-primary' : 'bg-outline-variant'
                        }`}
                      />
                    </div>
                    <div className="overflow-hidden flex-1 min-w-0">
                      <span className="font-headline font-semibold text-xs block text-white truncate">
                        {partner?.username}
                      </span>
                      <span
                        className={`text-[10px] block truncate mt-0.5 font-code ${
                          unreadCount > 0 ? 'text-primary font-medium' : 'text-on-surface-variant/60'
                        }`}
                      >
                        {subtitle || (
                          <span className="text-secondary/70 italic flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-secondary animate-pulse" />
                            Syncing cryptographic key...
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1.5 flex-shrink-0 ml-2">
                    {conv.lastMessageTimestamp && (
                      <span
                        className={`text-[9px] font-code ${
                          unreadCount > 0 ? 'text-primary' : 'text-on-surface-variant/40'
                        }`}
                      >
                        {formatTime(conv.lastMessageTimestamp)}
                      </span>
                    )}
                    {unreadCount > 0 ? (
                      <span className="bg-primary text-surface-container-lowest text-[9px] font-bold rounded-md min-w-[18px] h-[18px] flex items-center justify-center px-1 font-code">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    ) : (
                      <Lock
                        className={`h-3 w-3 transition-colors ${
                          hasKey
                            ? 'text-on-surface-variant/30'
                            : 'text-secondary-dim animate-pulse'
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 bg-surface-container-lowest/40 flex flex-col h-full overflow-hidden relative">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-outline-variant/30 px-6 flex items-center justify-between bg-surface/40 backdrop-blur-md z-10">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="relative">
                    <div className="h-9 w-9 rounded-lg bg-surface-container-high border border-outline-variant/50 flex items-center justify-center font-code font-bold text-xs text-white uppercase">
                      {getPartner(activeConversation)?.username?.substring(0, 2)}
                    </div>
                    <span
                      className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-surface ${
                        isUserOnline(getPartner(activeConversation)?._id)
                          ? 'bg-primary'
                          : 'bg-outline-variant'
                      }`}
                    />
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-headline font-bold text-sm text-white block leading-tight">
                      {getPartner(activeConversation)?.username}
                    </span>
                    <span className="text-[10px] text-on-surface-variant block truncate mt-0.5 font-code">
                      {isUserOnline(getPartner(activeConversation)?._id)
                        ? 'Active now'
                        : formatLastSeen(getPartner(activeConversation)?.lastSeen)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5 px-3 py-1 border border-primary/30 rounded-full bg-primary/5 text-[10px] text-primary font-code font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(47,243,173,0.05)]">
                    <Lock className="h-3 w-3 text-primary" />
                    <span>ML-KEM E2EE</span>
                  </div>
                </div>
              </div>

              {/* Messages View - Monospace Chat Font Applied */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 font-code">
                {/* Cryptographic key status banner */}
                {!sharedSecrets[activeConversationId] && (
                  <div className="p-4 border border-secondary-dim/30 bg-secondary-container/5 text-secondary rounded-xl text-xs leading-relaxed flex items-start space-x-3 max-w-xl mx-auto shadow-lg backdrop-blur-md">
                    <Lock className="h-4.5 w-4.5 mt-0.5 flex-shrink-0 text-secondary-dim animate-pulse" />
                    <div>
                      <span className="font-headline font-bold block mb-0.5 text-white">Device Key Syncing</span>
                      Waiting for the online peer to safely relay the conversation shared key over Socket.IO. Past messages will decrypt once synced.
                    </div>
                  </div>
                )}

                {/* Message items */}
                {(messages[activeConversationId] || []).map((msg, index) => {
                  const isSelf = msg.senderId === currentUser?._id;

                  return (
                    <div
                      key={msg._id || `msg-${index}`}
                      className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md rounded-xl p-3.5 text-xs border leading-relaxed shadow-lg relative ${
                          isSelf
                            ? 'bg-surface-container-high/80 border-primary/30 text-white rounded-br-none glow-effect'
                            : 'bg-surface border-outline-variant/30 text-on-surface rounded-bl-none'
                        }`}
                      >
                        <p className="select-text whitespace-pre-wrap font-code break-words">
                          {msg.plaintext}
                        </p>
                        <div className="mt-2 flex items-center justify-end space-x-1.5 text-[9px] text-on-surface-variant/40 font-code">
                          <span>{formatTime(msg.createdAt || msg.timestamp)}</span>
                          {isSelf && (
                            <span className="flex items-center">
                              {msg.status === 'seen' && (
                                <CheckCheck className="h-3.5 w-3.5 text-primary" />
                              )}
                              {msg.status === 'delivered' && (
                                <CheckCheck className="h-3.5 w-3.5 text-on-surface-variant/60" />
                              )}
                              {msg.status === 'sent' && (
                                <Check className="h-3.5 w-3.5 text-on-surface-variant/40" />
                              )}
                              {!msg.status && <Clock className="h-3 w-3 text-on-surface-variant/20" />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing indicators */}
              {typingUsers[activeConversationId]?.length > 0 && (
                <div className="px-6 py-2 text-[10px] text-primary italic bg-surface-container-lowest/30 border-t border-outline-variant/10 font-code flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary animate-ping" />
                  {getPartner(activeConversation)?.username} is typing...
                </div>
              )}

              {/* Message Composer - Monospace Input Font Applied */}
              <div className="p-4 border-t border-outline-variant/30 bg-surface/40 backdrop-blur-md">
                <form onSubmit={handleSendMessage} className="flex items-end space-x-3 max-w-7xl mx-auto">
                  <div className="flex-1 bg-surface-container-highest/60 border border-outline-variant/50 rounded-xl px-4 py-3 flex items-center focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all duration-200">
                    <textarea
                      placeholder="Type a secure message..."
                      value={messageText}
                      onChange={handleInputChange}
                      rows={1}
                      className="flex-1 bg-transparent border-0 outline-none text-xs text-white placeholder:text-on-surface-variant/30 resize-none align-middle self-center py-0.5 font-code focus:ring-0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!messageText.trim() || !sharedSecrets[activeConversationId]}
                    className="h-10 w-10 bg-primary text-surface-container-lowest hover:bg-primary-container rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-[0_0_10px_rgba(47,243,173,0.15)] active:scale-95"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface-container-lowest/10 relative z-0">
              <div className="w-16 h-16 rounded-2xl border border-outline-variant/40 flex items-center justify-center mb-6 bg-surface-container-high/60 shadow-xl glow-effect">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-headline font-bold text-base text-white">Secure Inbox Locked</h3>
              <p className="text-xs text-on-surface-variant max-w-xs mt-2 leading-relaxed">
                Select a channel from the sidebar or search a contact username to establish a keyset and start messaging.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
