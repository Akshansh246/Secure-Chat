# 🔐 Secure Chat Backend

A production-ready, real-time chat backend featuring **Post-Quantum Cryptography** with CRYSTALS-Kyber key exchange, **dual-layer AES-256-GCM encryption**, JWT authentication, and Socket.IO messaging.

---

## 🏗️ Security Architecture

### Dual-Layer Encryption

Every message passes through two independent encryption layers before storage. **MongoDB never contains plaintext messages, readable metadata, sender IDs, or receiver IDs.**

```
┌──────────────────────────────────────────────────────────────┐
│                    DUAL-LAYER ENCRYPTION                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Plaintext Message                                           │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────┐                     │
│  │  LAYER 1: Message Encryption        │                     │
│  │  AES-256-GCM (Message Key)          │                     │
│  │  Input:  Plain text                 │                     │
│  │  Output: Ciphertext₁               │                     │
│  └─────────────────────────────────────┘                     │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────┐                     │
│  │  PACKAGE ASSEMBLY                   │                     │
│  │  Ciphertext₁ + Sender ID +         │                     │
│  │  Receiver ID + Timestamp +          │                     │
│  │  Message Type + Status              │                     │
│  └─────────────────────────────────────┘                     │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────┐                     │
│  │  LAYER 2: Metadata Encryption       │                     │
│  │  AES-256-GCM (Metadata Key)         │                     │
│  │  Input:  Entire Package             │                     │
│  │  Output: Ciphertext₂ (stored)       │                     │
│  └─────────────────────────────────────┘                     │
│       │                                                      │
│       ▼                                                      │
│  MongoDB stores ONLY Ciphertext₂                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Post-Quantum Key Exchange (CRYSTALS-Kyber / ML-KEM-1024)

Keys are established using CRYSTALS-Kyber (standardized as ML-KEM by NIST FIPS 203), providing resistance against both classical and quantum computer attacks.

```
┌────────────────────────────────────────────────────────────┐
│                  KEY EXCHANGE FLOW                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Registration:                                             │
│    Server generates ML-KEM-1024 keypair                    │
│    Public key  → stored in database                        │
│    Private key → encrypted backup stored (AES-256-GCM)     │
│    Private key → returned to client (once)                 │
│                                                            │
│  Key Exchange (per conversation):                          │
│    Alice fetches Bob's public key                          │
│    Alice encapsulates → (ciphertext, sharedSecret)         │
│    Ciphertext sent to Bob via server                       │
│    Bob decapsulates → sharedSecret                         │
│                                                            │
│  Key Derivation:                                           │
│    Shared Secret                                           │
│         │                                                  │
│         ▼                                                  │
│    ┌──────────┐                                            │
│    │   HKDF   │  (SHA-256)                                 │
│    └────┬─────┘                                            │
│         │                                                  │
│    ┌────┴────┐                                             │
│    ▼         ▼                                             │
│  Message   Metadata                                        │
│   Key       Key                                            │
│  (256-bit) (256-bit)                                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Private Key Recovery

When a user logs in on a new device, the server decrypts their backed-up Kyber private key (encrypted at rest with a key derived from `AES_MASTER_KEY`) and returns it. This ensures **messages are always visible after authentication**, even on new devices.

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Revoke refresh token | No |

**POST /api/auth/register**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "securepassword123"
}
```
Response includes: `user`, `accessToken`, `refreshToken`, `kyberPrivateKey`

**POST /api/auth/login**
```json
{
  "email": "alice@example.com",
  "password": "securepassword123"
}
```
Response includes: `user`, `accessToken`, `refreshToken`, `kyberPrivateKey`

**POST /api/auth/refresh**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**POST /api/auth/logout**
```json
{
  "refreshToken": "your_refresh_token"
}
```

---

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/me` | Get current user profile | Yes |
| GET | `/api/users/search?q=query` | Search users by name/email | Yes |

---

### Conversations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/conversations` | Create a conversation | Yes |
| GET | `/api/conversations` | List user's conversations | Yes |

**POST /api/conversations**
```json
{
  "participantId": "user_object_id",
  "kyberCiphertext": "base64_kyber_ciphertext (optional)"
}
```

---

### Messages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/messages` | Send an encrypted message | Yes |
| GET | `/api/messages/:conversationId` | Get paginated messages | Yes |

**POST /api/messages**
```json
{
  "encryptedBlob": "base64_dual_layer_ciphertext",
  "conversationId": "conversation_object_id"
}
```

**GET /api/messages/:conversationId?page=1&limit=50**

---

### Keys

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/keys/public` | Update your Kyber public key | Yes |
| GET | `/api/keys/:userId` | Get a user's public key | Yes |

---

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health status |

---

## 🔌 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{ recipientId, encryptedBlob, conversationId, messageId }` | Send encrypted message |
| `message:delivered` | `{ messageId, senderId }` | Confirm delivery |
| `message:seen` | `{ messageIds, senderId, conversationId }` | Mark as seen |
| `typing:start` | `{ recipientId, conversationId }` | Start typing |
| `typing:stop` | `{ recipientId, conversationId }` | Stop typing |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `user:online` | `{ userId }` | User came online |
| `user:offline` | `{ userId, lastSeen }` | User went offline |
| `users:online` | `{ users: [userId] }` | Current online users (on connect) |
| `message:receive` | `{ senderId, encryptedBlob, conversationId, messageId, timestamp }` | Incoming message |
| `message:sent` | `{ messageId, timestamp }` | Send acknowledgement |
| `message:delivered` | `{ messageId, deliveredBy }` | Delivery confirmation |
| `message:seen` | `{ messageIds, seenBy, conversationId }` | Seen confirmation |
| `typing:start` | `{ userId, conversationId }` | Someone is typing |
| `typing:stop` | `{ userId, conversationId }` | Someone stopped typing |

### Connection Authentication

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_access_token'
  }
});
```

---

## 🛡️ Security Features

| Feature | Implementation |
|---------|---------------|
| Encryption | Dual-layer AES-256-GCM |
| Key Exchange | CRYSTALS-Kyber (ML-KEM-1024) |
| Key Derivation | HKDF-SHA256 |
| Password Hashing | bcrypt (12 rounds) |
| Authentication | JWT Access + Refresh Tokens |
| Rate Limiting | Per-route limits (global, auth, message) |
| HTTP Headers | Helmet |
| CORS | Configurable origin |
| NoSQL Injection | express-mongo-sanitize |
| Parameter Pollution | hpp |
| Input Validation | Joi schemas |
| Error Handling | Centralized, production-safe |

---

## 📁 Folder Structure

```
Backend/
├── .env.example            # Environment variable template
├── package.json            # Dependencies and scripts
├── server.js               # Entry point: HTTP + Socket.IO + DB
│
└── src/
    ├── app.js              # Express app assembly
    │
    ├── config/
    │   ├── index.js        # Central configuration
    │   └── db.js           # MongoDB connection
    │
    ├── crypto/
    │   ├── aes.js          # AES-256-GCM encrypt/decrypt
    │   ├── kdf.js          # HKDF key derivation
    │   ├── kyber.js        # ML-KEM-1024 key exchange
    │   └── encryption.js   # Dual-layer encryption orchestrator
    │
    ├── models/
    │   ├── User.js         # User schema with Kyber keys
    │   ├── Conversation.js # Conversation schema
    │   ├── Message.js      # Message schema (encrypted blob only)
    │   └── RefreshToken.js # Refresh token with TTL
    │
    ├── middleware/
    │   ├── auth.js         # JWT verification
    │   ├── rateLimiter.js  # Rate limiting tiers
    │   ├── validate.js     # Joi validation factory
    │   └── errorHandler.js # Global error handler
    │
    ├── services/
    │   ├── authService.js  # Auth logic + Kyber key management
    │   ├── userService.js  # User profile + search
    │   ├── conversationService.js
    │   ├── messageService.js
    │   └── keyService.js   # Public key management
    │
    ├── controllers/
    │   ├── authController.js
    │   ├── userController.js
    │   ├── conversationController.js
    │   ├── messageController.js
    │   └── keyController.js
    │
    ├── routes/
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── conversationRoutes.js
    │   ├── messageRoutes.js
    │   └── keyRoutes.js
    │
    ├── sockets/
    │   ├── socketAuth.js   # Socket JWT middleware
    │   └── socketHandler.js # Real-time event handlers
    │
    ├── validators/
    │   ├── authValidator.js
    │   ├── conversationValidator.js
    │   └── messageValidator.js
    │
    └── utils/
        ├── AppError.js     # Custom error class
        └── catchAsync.js   # Async error wrapper
```

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone and Install

```bash
cd Backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in all values in `.env`:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (e.g., `3000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing access tokens (use a long random string) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (different from JWT_SECRET) |
| `JWT_ACCESS_EXPIRY` | Access token lifetime (e.g., `15m`) |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime (e.g., `7d`) |
| `AES_MASTER_KEY` | 64-char hex string (256-bit key for private key backup encryption) |
| `KYBER_SECRET` | Application-level secret for HKDF domain separation |
| `CLIENT_URL` | Frontend URL for CORS (e.g., `http://localhost:5173`) |
| `NODE_ENV` | `development` or `production` |

**Generate secure keys:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start the Server

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

You should see:

```
✅ MongoDB connected: localhost
🚀 Server running on port 3000 in development mode
🔒 Post-Quantum Encryption: CRYSTALS-Kyber (ML-KEM-1024) enabled
🛡️  Dual-layer AES-256-GCM encryption active
📡 WebSocket server ready
```

---

## 📜 License

ISC
