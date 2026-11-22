# ArchMentor AI

Interactive system design learning platform: pick a challenge, design an architecture on a canvas, get it evaluated by a rule engine.

## Setup

**Requirements:** Node.js 20+, a PostgreSQL database (Neon).

### 1. Database
Run these in the Neon SQL editor, in order:

1. `backend/src/database/schema.sql` (new database)
   - Existing database? Run `backend/src/database/migrations/002_add_evaluation_config.sql` instead.
2. `backend/src/database/seeds/challenges.seed.sql` (adds 3 challenges with evaluation rules; safe to re-run)

### 2. Backend
```bash
cd backend
cp .env.example .env     # then fill in DATABASE_URL and JWT_SECRET
npm install
npm run dev              # http://localhost:5000
npm test                 # rule engine unit tests
```

### 3. Frontend
```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > .env.local
npm install
npm run dev              # http://localhost:3000
```

## API (`/api/v1`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | no | Create account |
| POST | `/auth/login` | no | Returns `{ user, token }` |
| GET | `/auth/me` | yes | Current user |
| POST | `/auth/logout` | no | Clears fallback cookie |
| GET | `/challenges`, `/challenges/:id` | no | Challenges (rules are never exposed) |
| GET/POST | `/projects` | yes | List / create projects |
| GET/PUT | `/projects/:id` | yes | Load / save title, nodes, edges, status |
| POST | `/projects/:id/evaluate` | yes | Run the rule engine on the saved design |

Errors always look like `{ success: false, message, details? }`.

## Rule engine

- `src/rules/genericRules.js`: checks that apply to every design (isolated nodes, wrong arrow direction, cycles, load balancer / cache / queue / database sanity).
- `src/rules/challengeRules.js`: driven by `challenges.evaluation_config` (required / recommended / forbidden components and connections). A new challenge is data, not code.
- `src/services/validation.service.js`: `evaluateArchitecture()` is a pure function; score = 100 minus the penalty of each issue.
