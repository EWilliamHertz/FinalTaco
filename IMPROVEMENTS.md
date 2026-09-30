# Hatake.Social - Engineering & Design Vision

## 🚀 Immediate Enhancements
1. **Dynamic Avatar Functionality (In Progress):**
   - The "USR" profile avatar in the top right will open a sliding glassmorphic sidebar.
   - It will contain your profile stats, collection valuation, and quick links to "My Vault", "Settings", and "Sign Out".
2. **Neon DB + Prisma Auth Flow:**
   - Instead of mock routing, the login gateway now checks the actual PostgreSQL database. 
   - Unknown emails will seamlessly unfold the registration form.
   - Resend API will issue branded OTP/magic links to verify collectors before vault creation.

## 💎 Modern UI/UX Tips & Tricks
1. **Micro-interactions:**
   - Use `framer-motion`'s `layoutId` (like in the Navigation bar) to smoothly transition elements between pages (e.g., clicking a card in the Database should visually expand it into the detail view without hard reloading).
2. **Glassmorphism & Depth:**
   - Keep leveraging `backdrop-blur-xl` and `bg-black/60`. In Next.js, layering these over subtle, slow-moving SVG gradients creates a high-end "luxury" feel.
3. **Data Fetching:**
   - Use React Suspense boundaries (`loading.tsx`) with pulsing skeleton loaders for the TCGCSV API calls so the UI never freezes while waiting for heavy set lists to load.
4. **Optimistic Updates:**
   - When users "heart" a feed post or add a card to their collection, immediately update the UI state using Zustand before waiting for the Neon DB response. This makes the app feel infinitely faster.

## 🛠 Next Technical Steps (Roadmap)
- [ ] Complete Server Actions for `registerUser`, `loginUser`, and `verifyEmail`.
- [ ] Connect the `+ Add to Vault` button on TCGCSV Database cards to insert records into the Neon `Collection` table.
- [ ] Map the "Feed" to pull real user activity ("Collector X just pulled Charizard!") from a PostgreSQL `Activity` table.
