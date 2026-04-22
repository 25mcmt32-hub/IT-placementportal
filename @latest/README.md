# Placement Portal

This project now includes:

- a Vite React frontend in `@latest`
- an Express + MongoDB backend in `@latest/backend`

## Backend setup

1. Create `@latest/backend/.env` from `@latest/backend/.env.example`
2. Add your MongoDB connection string to `MONGODB_URI`
3. Install backend packages inside `@latest/backend`
4. Start the backend with `npm run dev`

## Frontend setup

1. Install frontend packages inside `@latest`
2. Optionally add `VITE_API_URL=http://localhost:5000/api` to `@latest/.env`
3. Start the frontend with `npm run dev`

## API routes

- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/health`

## Demo DB users

- Faculty: `faculty_admin` / `faculty123`
- Coordinator: `coordinator_admin` / `coord123`

These two users are seeded into MongoDB automatically when the backend starts.
