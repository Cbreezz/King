# NightVibe

NightVibe is a nightlife discovery and community platform for people who want to find what is happening, follow the DJs and venues they care about, and participate in the energy of an event beyond the dance floor.

The product brings nightlife fans, DJs, and clubs into one experience: discover DJs and venues, explore live events, share moments, join event conversations, and build a reputation within the community.

> **Project status:** NightVibe is an actively maintained, continuing project. This is an evolving MVP/prototype: the core product surfaces and API foundations are in place, while production hardening, live-data coverage, and some realtime flows are still being built and validated. New features, improvements, and fixes are ongoing.

## What NightVibe is building

Nightlife discovery is often fragmented across social feeds, venue pages, event listings, and private group chats. NightVibe is designed to make that journey more connected:

1. **Discover** DJs, clubs, and nightlife activity.
2. **Decide** where to go and who to follow.
3. **Participate** through live chat, reactions, and realtime event presence.
4. **Share** moments from the night.
5. **Return** to a personalized community built around nightlife.

## Current product areas

- **DJ discovery and profiles** — Browse DJs, view profiles, follow them, and rate them.
- **Club discovery and profiles** — Explore clubs, club details, imagery, and related nightlife activity.
- **Moments** — Share nightlife photos and posts, with support for uploads and likes.
- **Live chat** — Join room-based conversations with other fans during events, including reactions.
- **Live DJ experiences** — Dedicated live routes support realtime DJ-focused interactions and Agora-powered audio/video capabilities where configured.
- **Leaderboards and stats** — Surface community rankings and activity across DJs and clubs.
- **Accounts and profiles** — Sign up, log in, verify email, recover passwords, manage profiles, and change passwords.
- **Role-aware experiences** — Separate fan and DJ dashboard surfaces support the different needs of the community.
- **Responsive experience** — Designed for mobile-first nightlife use while supporting desktop layouts, with PWA support in the project foundation.

## Tech stack

- **Application:** Next.js, React, TypeScript
- **UI:** Tailwind CSS, shadcn/ui patterns, Radix UI, Lucide icons
- **Data:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js with Prisma adapter
- **Realtime:** Socket.IO, with a separate Node.js socket server
- **Live media:** Agora Web SDK and Agora access tokens
- **Media storage:** Vercel Blob for supported uploads
- **Validation and forms:** Zod and React Hook Form
- **Deployment target:** Vercel for the web application; the socket server can run as a separate service

## Repository structure

```text
app/                  Next.js routes, pages, layouts, and API handlers
components/           Shared UI components
lib/                  Shared application utilities and services
prisma/               Database schema, migrations, seed, and reset scripts
socket-server/        Standalone Socket.IO server
public/               Static assets
scripts/              Project utilities
```

## Getting started

### Prerequisites

- Node.js 18 or later
- npm
- PostgreSQL
- Credentials for the services you plan to use locally (NextAuth, Agora, Blob, and Socket.IO as applicable)

### Install

```bash
git clone https://github.com/Cbreezz/King.git
cd King
npm install
```

### Configure environment variables

Copy the example file and fill in the values for your environment:

```bash
cp .env.example .env.local
```

The application may use the following variables depending on the features you are running:

```text
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SOCKET_SERVER
NEXT_PUBLIC_AGORA_APP_ID
AGORA_APP_CERTIFICATE
BLOB_READ_WRITE_TOKEN
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Do not commit real secrets. Some local setups may use additional environment files for email or testing; keep those values private as well.

### Prepare the database

Generate the Prisma client and apply the existing migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

To load development seed data:

```bash
npm run seed
```

To reset the development database and reseed it:

```bash
npm run reset-db
```

### Run the web app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run realtime features

The Socket.IO server runs separately on port 3001 by default:

```bash
npm run socket
```

For the web app and socket server together:

```bash
npm run dev:all
```

Set `NEXT_PUBLIC_SOCKET_SERVER` to the socket server URL when using chat or realtime features. If the socket server is deployed separately, update that value in the web app environment after deployment.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run socket` | Start the Socket.IO server |
| `npm run dev:all` | Start the web app and Socket.IO together |
| `npm run build` | Create a production build |
| `npm run start` | Start the production build |
| `npm run lint` | Run the configured lint command |
| `npm run seed` | Seed the development database |
| `npm run reset-db` | Reset the development database |
| `npx prisma studio` | Inspect database records locally |

## Architecture notes

NightVibe uses Next.js pages and API route handlers as the web and application layer. Prisma provides the PostgreSQL data access layer for users, DJs, clubs, moments, follows, ratings, and related product data. Realtime chat and presence are handled by Socket.IO outside the Next.js process, while Agora token generation is kept server-side for live media flows.

The codebase currently contains both product routes and supporting health/test routes for validating the web, database, socket, and live-media foundations. Availability of live data depends on the configured database and service credentials.

## Roadmap

The next highest-value work is focused on making the MVP dependable for a first real audience:

- Improve authentication, verification, and protected-route reliability.
- Make discovery consistently populated with trustworthy DJ, club, and event data.
- Harden Socket.IO connection, reconnection, room, and deployment behavior.
- Validate Agora live-session flows and failure states end to end.
- Improve accessibility, keyboard navigation, loading states, and mobile polish.
- Add automated coverage for the most important user journeys.
- Tighten validation, authorization, media handling, observability, and production security.

## Contributing

1. Create a feature branch from `master`.
2. Make a focused change and verify the relevant user flow.
3. Run the available checks before opening a pull request.
4. Describe the product impact and any environment setup required.


## Vision

NightVibe is being built to help people experience nightlife as a living community: discover the right night, connect with the people shaping it, and keep the memory going after the music stops.
