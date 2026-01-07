# Asụsụ Ohafia - Igbo Language Learning PWA

A community-powered Progressive Web App for learning Igbo language (Ohafia dialect). Built with modern web technologies and designed for mobile-first, offline-capable learning.

## 🎭 Theme: Ohafia War Dance Spirit

This app's design reflects the bravery and cultural heritage of Ohafia Community in Abia State, Nigeria. The color palette draws from:
- **Ohafia Primary** (#ED5A1C) - The bold energy of the Ohafia War Dance
- **Earth Brown** (#5D4E37) - Connection to ancestral lands
- **Warm Sand** (#F5E6D3) - Traditional architecture
- **Royal Gold** (#D4A84B) - Pride and achievement
- **Warrior Red** (#8B0000) - Bravery and courage

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS 3.4 (mobile-first)
- **State Management**: Zustand 4.5 (with persistence)
- **Backend**: Supabase (Auth, Database, Storage)
- **PWA**: Vite PWA Plugin + Workbox
- **Offline Storage**: IndexedDB (via idb)
- **Icons**: Lucide React

## 📱 Features

### Learner Experience
- ✅ Personalized onboarding (age, learning style, goals)
- ✅ Daily lesson plans with streak tracking
- ✅ Speaking practice with audio recording
- ✅ Listening comprehension exercises
- ✅ Flashcard vocabulary drills
- ✅ Progress tracking with XP and achievements
- ✅ Offline-first with background sync
- ✅ Installable PWA (add to home screen)

### Contributor Portal ("Language Asset Studio")
- ✅ Create vocabulary, phrases, sentences, proverbs
- ✅ Add pronunciation guides and cultural notes
- ✅ Recording studio for audio pronunciations
- ✅ Track submission status (draft, pending, approved)
- ✅ View contribution statistics

### Admin/Reviewer Dashboard
- ✅ Review queue for submitted content
- ✅ User management with role assignments
- ✅ Lesson creation and organization
- ✅ Content management and moderation
- ✅ Platform settings and feature flags

### Authentication
- ✅ Email + Password sign in
- ✅ Passwordless OTP (magic link)
- ✅ Email verification
- ✅ Profile management

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase project (free tier works)

### Quick Start

1. **Clone and install**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Set up database** (see Supabase Setup below)

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:5173

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🗄️ Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public key** from Settings > API

### 2. Run Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase/schema.sql`
3. Click **Run** to execute

This creates:
- User profiles with roles (learner, contributor, reviewer, admin)
- Lessons table for curriculum organization
- Assets table for vocabulary and phrases
- Attempts table for learning progress
- Progress tracking per lesson
- Audio submissions for community recordings
- Achievements for gamification
- Row Level Security policies

### 3. Configure Authentication

1. Go to **Authentication > Providers**
2. Ensure **Email** provider is enabled
3. Configure email templates in **Authentication > Email Templates**:
   - Confirmation email
   - Magic link email
   - Password reset email

4. For OTP/Magic Links, go to **Authentication > Settings**:
   - Enable "Enable email confirmations"
   - Set appropriate token expiry times

### 4. Set Up Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Create these buckets:

   | Bucket | Purpose | Public |
   |--------|---------|--------|
   | `audio` | Pronunciation recordings | Yes |
   | `images` | Lesson/asset images | Yes |
   | `avatars` | User profile pictures | Yes |

3. Add storage policies (example for audio bucket):
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Users can upload audio" ON storage.objects
     FOR INSERT WITH CHECK (
       bucket_id = 'audio' AND auth.role() = 'authenticated'
     );

   -- Allow public to read approved audio
   CREATE POLICY "Public can read audio" ON storage.objects
     FOR SELECT USING (bucket_id = 'audio');
   ```

### 5. Create First Admin User

1. Sign up through the app normally
2. In Supabase dashboard, go to **Table Editor > profiles**
3. Find your user and change `role` from `learner` to `admin`

---

## 🌐 Azure Static Web Apps Deployment

### Option 1: GitHub Actions (Recommended)

1. **Create Azure Static Web App**
   - Go to [Azure Portal](https://portal.azure.com)
   - Create a new **Static Web App**
   - Connect to your GitHub repository
   - Set build configuration:
     - App location: `/frontend`
     - Output location: `dist`
     - API location: (leave empty)

2. **Configure Environment Variables**
   
   In Azure Portal > Your Static Web App > Configuration:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Deploy**
   
   Push to your main branch - GitHub Actions will auto-deploy!

### Option 2: Azure CLI Manual Deploy

```bash
# Build the app
npm run build

# Install Azure SWA CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy ./dist --env production
```

### Option 3: Azure Storage Static Website

1. **Create Storage Account**
   ```bash
   az storage account create \
     --name asususohafia \
     --resource-group your-rg \
     --location eastus \
     --sku Standard_LRS
   ```

2. **Enable static website**
   ```bash
   az storage blob service-properties update \
     --account-name asususohafia \
     --static-website \
     --index-document index.html \
     --404-document index.html
   ```

3. **Upload build files**
   ```bash
   npm run build
   az storage blob upload-batch \
     --account-name asususohafia \
     --source ./dist \
     --destination '$web'
   ```

4. **Add CDN (optional)**
   - Create Azure CDN profile
   - Create endpoint pointing to storage static website URL
   - Configure custom domain and HTTPS

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/          # AppLayout, AuthLayout
│   │   ├── layouts/         # ContributorLayout, AdminLayout
│   │   └── ui/              # Reusable UI components
│   ├── features/
│   │   ├── auth/            # Authentication pages
│   │   ├── learner/         # Learning experience pages
│   │   ├── contributor/     # Contributor portal pages
│   │   └── admin/           # Admin dashboard pages
│   ├── stores/              # Zustand state stores
│   │   ├── auth-store.ts
│   │   ├── learner-store.ts
│   │   ├── contributor-store.ts
│   │   └── admin-store.ts
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── offline-db.ts    # IndexedDB for offline
│   ├── types/
│   │   └── database.ts      # TypeScript types
│   ├── App.tsx              # Main router
│   └── main.tsx             # Entry point
├── supabase/
│   └── schema.sql           # Database schema
├── public/                  # Static assets
└── dist/                    # Production build output
```

---

## 🔐 User Roles

| Role | Capabilities |
|------|--------------|
| **Learner** | Access lessons, track progress, earn achievements |
| **Contributor** | Create assets, record audio, submit for review |
| **Reviewer** | Approve/reject submissions, moderate content |
| **Admin** | All above + user management, settings, lessons |

---

## 🎮 Gamification

- **XP Points**: Earned for completing lessons and practices
- **Streaks**: Daily login rewards, tracked consecutively
- **Achievements**: Milestones like "First Lesson", "Week Warrior", etc.
- **Progress**: Per-skill tracking (speaking, listening, vocabulary)

---

## 🌍 Offline Support

The PWA is designed to work offline:

1. **Service Worker**: Caches app shell and static assets
2. **IndexedDB**: Stores learning attempts when offline
3. **Background Sync**: Syncs data when connection returns
4. **Install Prompt**: Add to home screen on mobile devices

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is for the Ohafia Community. Contact maintainers for usage rights.

---

## 🙏 Acknowledgments

- Ohafia Community for cultural guidance
- Native speakers for language verification
- Contributors who help preserve the Ohafia dialect

---

**Ndewo! Welcome to Asụsụ Ohafia!** 🇳🇬
