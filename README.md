# 🌍 Plavel - Plan Your Travel

A modern, full-stack travel planning application built with Next.js 15, allowing users to organize trips, manage itineraries, and visualize their travel journey on an interactive globe.

![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.16.2-2D3748)
![NextAuth](https://img.shields.io/badge/NextAuth-5.0-purple)

## ✨ Features

### 🔐 Authentication

- **OAuth Integration**: Sign in with GitHub or Google
- **Session Management**: Secure session handling with NextAuth v5
- **Account Linking**: Link multiple OAuth providers to the same account

### 🗺️ Trip Management

- **Create Trips**: Plan trips with title, description, dates, and cover images
- **Location Search**: Google Places Autocomplete with live suggestions
- **Interactive Maps**: Google Maps integration with custom markers and info windows
- **Drag & Drop Itinerary**: Reorder locations with smooth drag-and-drop
- **Map Preview**: Real-time preview when selecting locations
- **Edit & Delete**: Full CRUD operations with confirmation dialogs

### 🌐 Visualizations

- **Interactive Globe**: 3D globe visualization powered by react-globe.gl
- **Travel Stats**: Track countries visited and location counts
- **Multiple Views**: Overview, Itinerary, and Map tabs for each trip
- **Auto-fit Bounds**: Map automatically adjusts to show all locations

### 🎨 User Experience

- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Dark Mode Ready**: Styled with modern color schemes
- **Loading States**: Smooth transitions and loading indicators
- **Error Handling**: User-friendly error messages and validation
- **Hydration-Safe**: Handles browser extensions without hydration mismatches

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15.5.4 (App Router + Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI (Tabs), Custom Components
- **Icons**: Lucide React
- **Maps**: @react-google-maps/api, react-globe.gl
- **Drag & Drop**: @dnd-kit

### Backend

- **Runtime**: Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth v5 with Prisma Adapter
- **File Upload**: UploadThing
- **API**: Next.js API Routes (Server Actions)

### DevOps

- **Build Tool**: Turbopack
- **Linting**: ESLint 9
- **Type Checking**: TypeScript strict mode
- **Database Migrations**: Prisma Migrate

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- GitHub OAuth App credentials
- Google OAuth credentials
- Google Maps API key
- UploadThing account (for image uploads)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/NgYaoDong/plavel.git
cd plavel
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/plavel?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-here"  # Generate with: openssl rand -base64 32
# Alternative (NextAuth v5)
AUTH_SECRET="your-random-secret-here"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
GOOGLE_MAPS_API_KEY="your-google-maps-server-api-key"

# UploadThing
UPLOADTHING_TOKEN="your-uploadthing-token"
```

### 4. Set Up OAuth Applications

**GitHub OAuth:**

1. Go to GitHub Settings → Developer Settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`

**Google OAuth:**

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret to `.env.local`

**Google Maps API:**

1. Enable Maps JavaScript API and Places API
2. Create an API key
3. (Optional) Add HTTP referrer restrictions

### 5. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```bash
plavel/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   └── plavel_logo.svg        # App logo
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   └── trips/         # Trip API routes
│   │   ├── globe/             # 3D globe visualization
│   │   ├── trips/             # Trip management pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── trips/             # Trip-related components
│   │   │   ├── Map.tsx        # Google Maps component
│   │   │   ├── TripDetail.tsx # Trip detail view
│   │   │   ├── NewLocation.tsx # Add location form
│   │   │   ├── SortableItinerary.tsx # Drag & drop list
│   │   │   └── DeleteTripDialog.tsx  # Delete confirmation
│   │   ├── ui/                # Reusable UI components
│   │   └── NavBar.tsx         # Navigation bar
│   ├── lib/
│   │   ├── actions/           # Server actions
│   │   │   ├── create-trip.ts
│   │   │   ├── add-location.ts
│   │   │   ├── delete-trip.ts
│   │   │   └── reorder-itinerary.ts
│   │   ├── auth-actions.ts    # Client auth helpers
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── utils.tsx          # Utility functions
│   ├── types/
│   │   └── css.d.ts           # CSS module types
│   └── auth.ts                # NextAuth configuration
├── .env.local                 # Environment variables (not in git)
├── .gitignore
├── next.config.ts             # Next.js configuration
├── package.json
├── tailwind.config.ts         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

## 🎯 Key Features Explained

### Interactive Location Selection

- Type to search locations using Google Places Autocomplete
- Preview selected location on a mini map
- Click or drag the map marker to fine-tune coordinates
- Reverse geocoding updates the address automatically

### Drag & Drop Itinerary

- Reorder locations by dragging
- Changes sync across Overview and Itinerary tabs
- Server-side persistence with optimistic UI updates

### 3D Globe Visualization

- View all your travel locations on an interactive 3D globe
- Auto-rotation with smooth animations
- Country statistics and visited locations list
- Dynamic loading with SSR-safe implementation

### Map Interactivity

- Custom red markers for saved locations
- Click markers to show location names
- Polyline connecting locations in order
- Auto-fit bounds to show all points

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack

# Production
npm run build        # Build for production
npm start            # Start production server

# Database
npx prisma studio    # Open Prisma Studio
npx prisma generate  # Generate Prisma Client
npx prisma migrate dev    # Run migrations (dev)
npx prisma migrate deploy # Run migrations (prod)

# Linting
npm run lint         # Run ESLint
```

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**

    ```bash
    git add .
    git commit -m "Ready for deployment"
    git push
    ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel auto-detects Next.js settings

3. **Set Environment Variables**
   - Add all variables from `.env.local` to Vercel
   - Update `NEXTAUTH_URL` to your production domain

4. **Set Up Production Database**
   - Use Vercel Postgres, Supabase, or Neon
   - Update `DATABASE_URL` in Vercel

5. **Run Migrations**

    ```bash
    # Set production DB URL
    export DATABASE_URL="your-production-url"
    npx prisma migrate deploy
    ```

6. **Update OAuth Callbacks**
   - Add production callback URLs to GitHub/Google OAuth apps
   - Format: `https://your-domain.vercel.app/api/auth/callback/[provider]`

### Build Command (Vercel)

```bash
prisma generate && next build
```

## 🐛 Troubleshooting

### Prisma Client Issues

```bash
# Regenerate Prisma Client
npx prisma generate

# Reset database (dev only)
npx prisma migrate reset
```

### OAuth Errors

- Verify callback URLs match exactly
- Check CLIENT_ID and CLIENT_SECRET are correct
- Ensure NEXTAUTH_URL is set properly

### Map Not Loading

- Verify NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set
- Check Google Cloud Console for API restrictions
- Ensure Maps JavaScript API and Places API are enabled

### Hydration Mismatch

- The app includes `suppressHydrationWarning` on `<body>` for browser extensions
- This is normal and doesn't affect functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and not licensed for public use.

## 👤 Author

### Ng Yao Dong

- GitHub: [@NgYaoDong](https://github.com/NgYaoDong)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Maps by [Google Maps Platform](https://developers.google.com/maps)
- Globe visualization by [react-globe.gl](https://github.com/vasturiano/react-globe.gl)
- Authentication by [NextAuth.js](https://next-auth.js.org/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)

---

Made with ❤️ for travelers
