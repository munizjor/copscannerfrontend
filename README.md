# copscannerfrontend

This is a Next.js (TypeScript) app for displaying police scanner alerts from a PostgreSQL database and playing audio from AWS S3 using presigned URLs.

## Features
- Fetches recent alerts from a PostgreSQL database
- Displays alerts in a modern, responsive table (Tailwind CSS)
- Plays audio from S3 using presigned URLs
- API routes for alerts and audio

## Project Structure
- `app/page.tsx` — Main UI
- `app/api/alerts/route.ts` — Alerts API
- `app/api/audio/route.ts` — Audio presigned URL API
- `lib/db.ts` — PostgreSQL logic
- `lib/s3.ts` — S3 presigned URL logic

## Setup
1. Copy `.env.local.example` to `.env.local` and fill in your credentials:
   - `DATABASE_URL=postgresql://user:pass@rds-host.amazonaws.com:5432/db`
   - `AWS_REGION=us-east-1`
   - `S3_BUCKET=copscanneralert`
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.

## Deployment
Optimized for deployment on AWS (Vercel, Amplify, or EC2).

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/route.ts`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## API Routes

This directory contains example API routes for the headless API app.

For more details, see [route.js file convention](https://nextjs.org/docs/app/api-reference/file-conventions/route).
