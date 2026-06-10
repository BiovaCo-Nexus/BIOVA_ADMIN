# BiovaCo Nexus | Admin Portal

A highly secure, internal administration dashboard for managing BiovaCo Nexus operations, applications, and portal content. 

## Features
- **Application Management**: Track, review, and update candidate applications.
- **Newsletter Administration**: Manage confirmed and pending subscribers.
- **Content Management**: Update dynamic website content including locations, 3D models, videos, and post-countdown reveals.
- **Role-based Authentication**: Secured with Supabase.

## Tech Stack
- React 18
- Vite
- TypeScript
- Tailwind CSS
- Shadcn UI
- Supabase (Auth & Database)

## Setup
1. Clone the repository
2. Run `npm install`
3. Configure environment variables in `.env`
4. Run `npm run dev` to start the development server

## Security
This application is strictly internal. Search engine crawling is disabled via `robots.txt` and meta tags. Do not expose administrative routes to the public internet without proper authentication middleware.
