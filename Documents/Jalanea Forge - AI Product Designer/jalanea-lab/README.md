# Jalnaea Dev

Your private dev environment for managing projects, experiments, client previews, and internal tools.

## Features

- **Password Protected**: Secure access with cookie-based authentication (30-day persistence)
- **Dashboard**: Overview of all projects with quick stats and recent activity
- **Lab / Sandbox**: Track experiments from idea to graduation
- **Internal Tools**: Quick access to productivity tools
- **Client Previews**: Manage client project preview links with optional passwords
- **Dev Environment**: Track development/staging/production deployments
- **Mobile Responsive**: Full mobile support with bottom navigation

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Lucide React Icons
- js-cookie for cookie management

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter the password to access the dashboard.

### Password

Default password: `jalanea_e37254281em`

## Deploy to Vercel

### 1. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### 2. Connect Domain (jalnaea.dev)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add `jalnaea.dev` and follow DNS configuration instructions
3. For client subdomains, add `*.jalnaea.dev` as a wildcard domain

### 3. Client Subdomains Setup

To enable client preview subdomains (e.g., `acme.jalnaea.dev`):

1. In Vercel project settings, go to Domains
2. Add `*.jalnaea.dev` as a wildcard domain
3. Configure your DNS:
   - Add an A record: `*.jalnaea.dev` → Vercel's IP
   - Or CNAME: `*.jalnaea.dev` → `cname.vercel-dns.com`

Each subdomain will route to your deployment. To implement per-client password protection, you'll need to add middleware that checks the subdomain and validates the password.

## Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── lab/          # Experiments
│   │   ├── tools/        # Internal tools
│   │   ├── clients/      # Client previews
│   │   ├── dev/          # Dev environment
│   │   ├── settings/     # App settings
│   │   └── layout.tsx    # Dashboard layout
│   ├── page.tsx          # Login / Easter Egg
│   └── layout.tsx        # Root layout
├── components/           # Reusable UI components
├── data/
│   └── projects.json     # Project data (edit this!)
└── lib/
    ├── auth.ts           # Authentication helpers
    └── types.ts          # TypeScript types
```

## Editing Data

Project data is stored in `src/data/projects.json`. Edit this file directly to:

- Add/remove lab experiments
- Update tools list
- Manage client previews
- Track dev deployments

In a production app, you'd want to use a database (Supabase, Planetscale, etc.) instead.

## Easter Egg

If someone visits the dashboard without being logged in, they'll see a fun "You found the secret door!" animation with sparkles before being redirected to jalnaea.dev.

## License

Private project - All rights reserved.
