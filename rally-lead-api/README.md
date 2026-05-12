# rally-lead-api

API server for Kingshot Rally Optimizer.

## Setup

1. Install dependencies (also generates the Prisma client via `postinstall`):

   ```
   npm install
   ```

2. Set up Clerk (https://dashboard.clerk.com):
   - Create an application
   - Enable Discord + Google as OAuth providers
   - Copy the publishable and secret keys

3. Set up Postgres:
   - Local: install Postgres and create a database
   - Managed: provision on Neon, Supabase, or Railway and copy the connection string

4. Configure environment:

   ```
   cp .env.example .env
   ```

   Fill in `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`.

5. Run migrations:

   ```
   npm run db:migrate
   ```

6. Start the dev server:

   ```
   npm run dev
   ```

   Server listens on `http://localhost:3001`.

## Endpoints

| Method | Path             | Auth     | Notes                              |
|--------|------------------|----------|------------------------------------|
| GET    | /health          | public   | Liveness check                     |
| GET    | /me              | required | Returns Clerk userId               |
| GET    | /profiles        | required | List profiles for the current user |
| POST   | /profiles        | required | Create a profile                   |
| GET    | /profiles/:id    | required | Load a profile (owner only)        |
| PUT    | /profiles/:id    | required | Update a profile (owner only)      |

`kingshot_player_id` is globally unique (trust-on-first-use). Creating a profile
with an already-claimed player id returns 409.
