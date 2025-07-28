# Chatterly - Real-Time Chat App

A modern cross-platform mobile chat application built with React Native (Expo) and Supabase, featuring real-time messaging, user discovery, media sharing, and a beautiful WhatsApp-inspired UI.

## Features

- **Real-Time Messaging**: Instant message delivery with Supabase real-time subscriptions
- **User Discovery**: Find and connect with other users in the app
- **Personal Chats**: Direct messaging between users
- **Media Sharing**: Upload and share images with automatic compression
- **Modern UI**: WhatsApp-inspired design with smooth animations
- **Authentication**: Secure user authentication with Supabase Auth
- **Cross-Platform**: Works on iOS, Android, and Web
- **Offline Support**: Messages cached locally for offline viewing

## Tech Stack

### Frontend
- **React Native** with Expo Router
- **Redux Toolkit** for state management
- **NativeWind** (Tailwind CSS for React Native)
- **TypeScript** for type safety
- **Expo Image** for optimized image handling

### Backend & Database
- **Supabase** for authentication, database, and real-time subscriptions
- **PostgreSQL** database with Row Level Security
- **Supabase Storage** for media files

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd chatterly
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Supabase Setup

1. Create a new Supabase project at [Supabase Dashboard](https://supabase.com/dashboard)

2. Get your project URL and anon key from Settings > API

3. Create a `config/supabase.ts` file:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'your-project-url';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

4. Set up the database schema:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the SQL commands from `database/supabase-setup.sql`

5. (Optional) Add test users by running `database/add-test-users.sql`

### 4. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Enable Email authentication
3. Configure your site URL (for development: `exp://localhost:8081`)

### 5. Run the Application

```bash
# Start the Expo development server
npm start

# Or run on specific platform
npm run android  # For Android
npm run ios      # For iOS
npm run web      # For Web
```

### 6. Building for Production

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build -p android

# Build for iOS
eas build -p ios
```

## Project Structure

```
chatterly/
├── app/                           # Expo Router pages
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── index.tsx            # Chat list screen
│   │   ├── contacts.tsx         # User discovery screen
│   │   └── settings.tsx         # Settings screen
│   ├── auth.tsx                 # Authentication screen
│   ├── chat/[id].tsx           # Individual chat screen
│   └── _layout.tsx             # Root layout
├── assets/                      # Images and static files
├── components/                  # Reusable UI components
├── config/                     # Configuration files
│   ├── supabase.ts            # Supabase configuration
│   └── firebase.ts            # Firebase configuration (legacy)
├── database/                   # Database setup files
│   ├── supabase-setup.sql     # Main database schema
│   └── add-test-users.sql     # Test data
├── services/                   # API and service layers
│   ├── supabaseAuthService.ts # Authentication service
│   ├── supabaseChatService.ts # Chat/messaging service
│   └── notificationService.ts # Push notifications
├── store/                      # Redux store and slices
│   ├── index.ts              # Store configuration
│   └── slices/               # Redux slices
│       ├── authSlice.ts      # Authentication state
│       └── chatSlice.ts      # Chat state
└── server/                     # Optional Node.js server (legacy)
    ├── server.js              # Socket.io server
    └── package.json           # Server dependencies
```

## Key Features

### Real-Time Messaging
- Messages are sent and received instantly using Supabase real-time subscriptions
- Automatic message ordering and deduplication
- Offline message caching with Redux Persist

### User Discovery
- Browse all registered users in the contacts tab
- Search users by display name
- Start new conversations with any user

### Authentication
- Email/password authentication via Supabase Auth
- Automatic user profile creation
- Secure session management

### Media Sharing
1. User selects images using Expo ImagePicker
2. Images are compressed and uploaded to Supabase Storage
3. Media URLs are stored in message records
4. Images display with loading states and error handling

### Modern UI/UX
- WhatsApp-inspired chat interface
- Smooth animations and transitions
- Responsive design for all screen sizes
- Dark/light theme support (system-based)

## Configuration

### Environment Variables
Create a `.env` file in the root directory (optional):
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### App Icons and Assets
- `assets/images/icon.png` (1024x1024px) - App icon
- `assets/images/adaptive-icon.png` (1024x1024px) - Android adaptive icon
- `assets/images/favicon.png` (48x48px) - Web favicon

## Security Features

1. **Row Level Security**: Supabase RLS policies ensure users can only access their own data
2. **Authentication**: Secure JWT-based authentication
3. **Input Validation**: All user inputs are validated and sanitized
4. **Media Upload Security**: File type and size validation
5. **Real-time Security**: Subscription filters prevent unauthorized data access

## Performance Optimizations

1. **Image Compression**: Automatic image compression before upload
2. **Efficient State Management**: Redux Toolkit with proper serialization
3. **Real-time Subscriptions**: Optimized Supabase subscriptions with filters
4. **Memory Management**: Proper cleanup of subscriptions and listeners
5. **Lazy Loading**: Components and screens load on demand

## Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify your Supabase URL and anon key in `config/supabase.ts`
   - Check if your Supabase project is active
   - Ensure network connectivity

2. **Authentication Issues**
   - Verify email authentication is enabled in Supabase dashboard
   - Check if site URL is configured correctly
   - Ensure user registration is allowed

3. **Real-time Messages Not Working**
   - Check if real-time is enabled for your tables
   - Verify RLS policies allow the current user to access data
   - Check browser/app console for subscription errors

4. **Media Upload Failed**
   - Verify Supabase Storage bucket exists and is public
   - Check file size limits (default 50MB)
   - Ensure proper permissions for storage access

5. **App Won't Start**
   - Run `npm install` to ensure all dependencies are installed
   - Clear Expo cache: `npx expo start --clear`
   - Check for TypeScript errors: `npx tsc --noEmit`

## Development

### Running Tests
```bash
npm run lint  # Run ESLint
```

### Code Style
This project uses:
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting (configured in ESLint)

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

### Mobile App Deployment
1. Configure EAS Build: `eas build:configure`
2. Build for stores: `eas build --platform all`
3. Submit to stores: `eas submit`

### Server Deployment (Optional)
The app works completely without the Node.js server as it uses Supabase for real-time features. The server directory contains legacy Socket.io code that can be removed if not needed.

If you want to use the legacy server for custom real-time features:

```bash
# Install server dependencies
cd server
npm install

# Run in development
npm run dev

# Deploy to Railway, Render, or similar platforms
npm start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section above

---

Built with ❤️ using React Native, Expo, and Supabase