# CopScanner Frontend

This is a Next.js (TypeScript) app for displaying police scanner alerts from a PostgreSQL database and playing audio from AWS S3 using presigned URLs.

## Features

- Fetches recent alerts from a PostgreSQL database.
- Displays alerts in a modern, responsive interface.
- Plays audio from S3 using presigned URLs.
- Browser notifications for new alerts.
- Timestamps displayed in the user's local time zone.
- Redirects from old domains using middleware.

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [TypeScript](https://www.typescriptlang.org) - Typed JavaScript
- [PostgreSQL](https://www.postgresql.org) - Database
- [AWS S3](https://aws.amazon.com/s3/) - Audio storage
- [Luxon](https://moment.github.io/luxon/) - Date and time library

## Project Structure

- `app/page.tsx` — Main UI component
- `components/` — Reusable React components
- `lib/` — Utility functions (API, date, notifications, etc.)
- `middleware.ts` — Handles redirects
- `public/` — Static assets
- `styles/` — Global CSS styles

## Setup

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Set up environment variables:**

    Copy `.env.local.example` to `.env.local` and fill in your credentials:

    ```
    DATABASE_URL=...
    AWS_REGION=...
    S3_BUCKET=...
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment

This app is optimized for deployment on platforms like Vercel, Netlify, or AWS Amplify. The `middleware.ts` file handles redirects from old domains to the new one.
