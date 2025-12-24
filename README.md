# Chatterly – Real-Time Chat App

A production-ready real-time messaging mobile application built with Expo (React Native), Socket.io, and Firebase.

![Chatterly](https://img.shields.io/badge/Chatterly-v1.0.0-blue)
![Expo](https://img.shields.io/badge/Expo-54-000020)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-black)
![Firebase](https://img.shields.io/badge/Firebase-12-orange)

## ✨ Features

### Core Features

- 💬 **Real-time Messaging** - Instant message delivery via Socket.io
- 👥 **Group & Private Chats** - Create 1-on-1 or group conversations
- 🟢 **Online Status** - See who's online in real-time
- ✍️ **Typing Indicators** - Know when someone is typing
- **Secure Authentication** - Firebase Auth with token verification

### Media & UX

- 📷 **Image Sharing** - Send photos via Firebase Storage
- 🌙 **Dark Mode** - Modern dark theme UI
- 📱 **Responsive Design** - Optimized for all screen sizes
- 🎨 **Smooth Animations** - Premium feel interactions

### Bonus Features

- 👍 **Message Reactions** - React with emojis (�❤️😂😮😢🙏)
- ✏️ **Edit & Delete Messages** - Modify or remove your messages
- 🔍 **Chat Search** - Find chats and messages quickly
- 🔕 **Mute Conversations** - Silence notifications for specific chats

## �🛠️ Tech Stack

### Mobile App

- **Framework**: Expo (React Native) with TypeScript
- **Navigation**: Expo Router
- **Styling**: React Native Stylesheets (Dark Theme)
- **State Management**: Redux Toolkit
- **Media**: expo-image-picker

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Authentication**: Firebase Admin SDK

### Database & Auth

- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage

## 📦 Project Structure

```
Chatterly/
├── mobile/                    # Expo mobile app
│   ├── app/                   # Expo Router screens
│   │   ├── (auth)/           # Auth screens (login, register)
│   │   ├── (main)/           # Main app screens
│   │   └── chat/             # Chat screens
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── services/         # Firebase, Socket, API
│   │   ├── store/            # Redux slices
│   │   └── types/            # TypeScript definitions
│   ├── app.config.ts
│   └── package.json
│
└── backend/                   # Node.js backend
    ├── src/
    │   ├── server.js         # Express + Socket.io
    │   ├── sockets/          # Socket event handlers
    │   ├── routes/           # REST API routes
    │   ├── middleware/       # Auth middleware
    │   └── firebase/         # Firebase Admin
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager
- Firebase project with Auth, Firestore, and Storage enabled
- Expo Go app (for mobile testing)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/chatterly.git
cd chatterly

# Install mobile dependencies
cd mobile
pnpm install

# Install backend dependencies
cd ../backend
pnpm install
```

### 2. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Enable Storage
5. Update `mobile/app.config.ts` with your Firebase config

### 3. Backend Setup

```bash
# Copy environment example
cd backend
cp .env.example .env

# Edit .env with your Firebase service account credentials
# Download from Firebase Console > Project Settings > Service Accounts
```

### 4. Run the App

**Terminal 1 - Backend:**

```bash
cd backend
pnpm start
# Server runs on http://localhost:3001
```

**Terminal 2 - Mobile:**

```bash
cd mobile
pnpm start
# Scan QR code with Expo Go
```

## 🔐 Environment Variables

### Backend (.env)

```env
PORT=3001
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Mobile (app.config.ts)

Firebase config is stored in `extra.firebase` section.

## 📱 Firestore Schema

### Users Collection

```javascript
users/{uid}
{
  uid: string,
  name: string,
  email: string,
  photoURL: string | null,
  online: boolean,
  lastSeen: timestamp,
  pushToken: string
}
```

### Chats Collection

```javascript
chats/{chatId}
{
  participants: string[],
  isGroup: boolean,
  groupName: string | null,
  groupAvatar: string | null,
  createdAt: timestamp,
  updatedAt: timestamp,
  lastMessage: { ... }
}
```

### Messages Subcollection

```javascript
chats/{chatId}/messages/{messageId}
{
  senderId: string,
  senderName: string,
  type: 'text' | 'image',
  content: string,
  imageUrl: string | null,
  timestamp: timestamp,
  readBy: string[],
  reactions: { [emoji]: string[] }
}
```

## 🔌 Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-chat` | `{ chatId }` | Join a chat room |
| `leave-chat` | `{ chatId }` | Leave a chat room |
| `send-message` | `{ chatId, type, content, imageUrl? }` | Send a message |
| `typing` | `{ chatId }` | Broadcast typing status |
| `stop-typing` | `{ chatId }` | Stop typing broadcast |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `new-message` | `Message` | New message received |
| `user-typing` | `{ chatId, userId }` | User started typing |
| `user-stopped-typing` | `{ chatId, userId }` | User stopped typing |
| `user-online` | `{ userId }` | User came online |
| `user-offline` | `{ userId, lastSeen }` | User went offline |

## 🚀 Deployment

### Mobile (Expo EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for production
eas build --platform all
```

### Backend (AWS App Runner)

1. Push code to GitHub
2. Connect to AWS App Runner
3. Configure environment variables
4. Deploy

## 📄 License

MIT License - feel free to use this project for learning or production.

---

Built with ❤️ using Expo, Socket.io, and Firebase
