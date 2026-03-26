# Frigi

Frigi is a fridge-packing puzzle game built as a monorepo with:

- `mobile/`: Expo / React Native client
- `backend/`: FastAPI API with Postgres, Redis, and adaptive level generation
- `shared/`: shared TypeScript types used by the mobile app

The game supports:

- campaign progression
- daily challenges
- backend-persisted sessions and scores
- live leaderboards
- adaptive difficulty with a formal progression model

## Repo Layout

```text
frigi/
  backend/   FastAPI API, SQLAlchemy models, Alembic migrations
  mobile/    Expo app with expo-router
  shared/    Shared TS types/constants
  scripts/   Deployment and infra helper scripts
```

## Tech Stack

- Mobile: Expo SDK 54, React Native 0.81, expo-router, Zustand, React Query
- Backend: FastAPI, SQLAlchemy async, Alembic, asyncpg, Redis
- Database: Postgres
- Deployment: Google Cloud Run

## Local Development

### 1. Install dependencies

From the repo root:

```sh
npm install
```

### 2. Start local infrastructure

```sh
docker compose up -d postgres redis
```

This starts:

- Postgres on `localhost:5433`
- Redis on `localhost:6379`

### 3. Configure backend env

Create `backend/.env` from `backend/.env.example` and set at least:

```env
DATABASE_URL=postgresql+asyncpg://frigi:frigi_dev@localhost:5433/frigi
DB_SCHEMA=frigi
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=dev-secret-key
OPENAI_API_KEY=
```

### 4. Run migrations

```sh
cd backend
alembic upgrade head
```

### 5. Start the backend

```sh
cd backend
uvicorn app.main:app --reload
```

API defaults to `http://localhost:8000`.

### 6. Start the mobile app

Set the mobile API URL in `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Then run:

```sh
cd mobile
npx expo start --clear
```

For native config changes such as icons, splash, and notifications, use:

```sh
cd mobile
npx expo run:ios
# or
npx expo run:android
```

## Workspace Scripts

From repo root:

```sh
npm run mobile
npm run shared:build
npm run shared:watch
```

From `mobile/`:

```sh
npm run start
npm run ios
npm run android
npm run web
```

## Backend Overview

Main entry point:

- `backend/app/main.py`

Primary routes:

- `/health`
- `/players`
- `/levels`
- `/sessions`
- `/scores`

Key persistence models:

- `players`
- `levels`
- `game_sessions`
- `scores`
- `player_level_progress`
- `player_difficulty_history`

## Game Progression

Campaign progression uses a formal shared model defined in:

- `backend/app/services/progression_model.py`

This model drives:

- seeded campaign level difficulties
- generated fallback level difficulties
- allowed difficulty bands per campaign level

## Deployment

Cloud Run deploy script:

- `scripts/deploy-backend-cloud-run.sh`

Default deploy target:

- project: `name-chain-439816`
- region: `us-central1`
- service: `frigi-api`

The script reads values from `backend/.env` and deploys the backend container.

## Notes

- `mobile/ios/` and `mobile/android/` are intentionally ignored because Expo prebuild can regenerate them.
- `PROJECT.md` is intentionally local-only and is meant for internal agent handoff/context.
