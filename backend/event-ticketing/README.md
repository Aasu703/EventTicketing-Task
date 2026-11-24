# Event Ticketing API

A NestJS REST API for an event ticketing platform where organizers create events, customers buy tickets, and admins oversee the platform.

---

##  Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Using Docker (Recommended)

```bash
# Clone and navigate
cd backend/event-ticketing

# Start all services (PostgreSQL, Redis, API)
docker compose up -d --build

# Run database migrations
docker compose exec app npx prisma migrate deploy

# Access API
# http://localhost:3000
# Swagger docs: http://localhost:3000/api/docs
```

### Local Development

```bash
# 1. Start PostgreSQL (your local instance) and Redis
docker run -d -p 6379:6379 redis:7-alpine

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Install dependencies
npm install

# 4. Run migrations
npx prisma migrate deploy

# 5. Start development server
npm run start:dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/event_ticketing` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | Required |
| `PORT` | API port | `3000` |

---

##  Architecture

### Choice: Modular Monolith with Clean Architecture Layers

```
src/
├── auth/           # Authentication module
├── event/          # Event & ticket type management
├── orders/         # Order processing & payments
├── tickets/        # Ticket issuance & check-in
├── reports/        # Organizer sales reports
├── admin/          # Admin dashboard & user management
├── common/         # Shared utilities (guards, decorators, pagination)
├── prisma/         # Database client & module
└── main.ts         # App bootstrap + Swagger
```

### Reasoning

| Decision | Rationale |
|----------|-----------|
| **NestJS** | Built-in DI, modules, guards, pipes, Swagger integration |
| **Prisma ORM** | Type-safe database access, migrations, relation handling |
| **PostgreSQL** | ACID compliance, JSON support, mature ecosystem |
| **Redis** | Caching public listings, session store, rate limiting |
| **Modular structure** | Separation of concerns, independent deployability later |
| **JWT + Role Guards** | Stateless auth, fine-grained authorization |

### Data Flow

```
Client → Auth Guard → Role Guard → Controller → Service → Repository → Prisma → PostgreSQL
                    ↓
              Redis Cache (public listings)
```

---

##  Branching Strategy



```
main
  │
  ├── develop
  │     │
  │     ├── feature/auth-refactor
  │     ├── feature/event-tickets
  │     └── feature/admin-dashboard
  │
  ├── release/v1.0.0
  │
  └── hotfix/security-patch
```

### Rules

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production-ready | PR required, CI must pass |
| `develop` | Integration branch | PR required |
| `feature/*` | New features | PR to `develop` |
| `release/*` | Release preparation | PR to `main` |
| `hotfix/*` | Production fixes | PR to `main` + `develop` |

### Commit Convention

```
<type>(<scope>): <subject>

feat(orders): add mock Esewa payment endpoint
fix(tickets): prevent double check-in race condition
docs(readme): add architecture section
refactor(events): extract ticket type service
```

---

##  Concurrency Control

### Overselling Prevention

**Problem:** Multiple users buying last tickets simultaneously.

**Solution: Database-Level Atomic Operations**

```typescript
// orders.service.ts
async create(dto: CreateOrderDto, customerId: number) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Lock ticketType row (SELECT FOR UPDATE equivalent)
    const ticketType = await tx.ticketType.findUnique({
      where: { id: dto.ticketTypeId },
      include: { event: true }
    });

    // 2. Check availability INSIDE transaction
    const available = ticketType.quantity - ticketType.sold;
    if (dto.quantity > available) {
      throw new BadRequestException(`Only ${available} tickets available`);
    }

    // 3. Atomic increment - single SQL UPDATE
    await tx.ticketType.update({
      where: { id: dto.ticketTypeId },
      data: { sold: { increment: dto.quantity } }
    });

    // 4. Create order + 15-min hold
    return tx.order.create({ ... });
  });
}
```

**Mechanisms:**
| Layer | Technique |
|-------|-----------|
| Transaction | All ops in single ACID transaction |
| Atomic Increment | `sold: { increment: N }` → `UPDATE SET sold = sold + N` |
| Row Lock | Implicit via transaction isolation |
| Hold Expiry | 15-min `TicketHold` auto-cleaned by cron |

### Double Check-In Prevention

**Problem:** Same ticket scanned twice (network retry, duplicate scan).

**Solution: Idempotent Check + Atomic Update**

```typescript
// tickets.service.ts
async checkIn(code: string, organizerId: number) {
  const ticket = await this.repo.findByCode(code);

  // 1. Validate ownership & status
  if (ticket.event.organizerId !== organizerId) 
    throw new ForbiddenException('Not your event');
  if (ticket.event.status === EventStatus.CANCELLED)
    throw new BadRequestException('Event is cancelled');

  // 2. IDEMPOTENT CHECK - fail fast
  if (ticket.checkedIn) {
    throw new BadRequestException(
      `Ticket already checked in at ${ticket.checkedInAt.toISOString()}`
    );
  }

  // 3. Atomic update
  return this.repo.checkIn(ticket.id, organizerId);
}

// Repository - single row update
async checkIn(ticketId: number, checkedInBy: number) {
  return this.prisma.ticket.update({
    where: { id: ticketId },
    data: {
      checkedIn: true,
      checkedInAt: new Date(),
      checkedInBy,
    },
  });
}
```

**Guarantees:**
| Layer | Protection |
|-------|------------|
| Application | `if (checkedIn) throw` fails fast |
| Database | Single-row update is atomic |
| Response | Returns original `checkedInAt` timestamp |

---

##  Trade-offs & Limitations

### Trade-offs Made

| Area | Decision | Trade-off |
|------|----------|-----------|
| **Payment** | Mock Esewa | No real payment integration; easy to swap |
| **Caching** | Redis only for public listings | No cache invalidation for organizer data |
| **Auth** | JWT only (no refresh tokens) | Simpler but shorter sessions |
| **Soft Deletes** | `isActive` flag on users | No hard delete, data retained |
| **Events** | Single ticket price + types | No dynamic pricing, waitlists |
| **Seats** | General admission only | No seat selection/reservation |

### Known Limitations

| Limitation | Impact |
|------------|--------|
| **No real payment gateway** | Mock always succeeds; needs Esewa/Stripe integration |
| **No email notifications** | Order confirmations, reminders missing |
| **No seat maps** | General admission only |
| **No waitlist** | Sold out = no purchase option |
| **Single currency** | No multi-currency support |
| **No rate limiting** | Auth endpoints exposed |
| **Cron needs Redis** | Background jobs fail without Redis |
| **No audit logs** | Admin actions not tracked |

---

##  Future Improvements

### With More Time

| Priority | Improvement | Effort |
|----------|-------------|--------|
| **Real Payment Gateway** | Esewa/Stripe webhook integration | Medium |
| **Email/Notifications** | SendGrid/SES for confirmations | Low |
| **Refresh Tokens** | JWT rotation, secure storage | Medium |
| **Rate Limiting** | Throttler on auth/order endpoints | Low |
| **Audit Logs** | Admin action tracking | Medium |
| **Seat Maps** | Reserved seating, venue maps | High |
| **Waitlist** | Notify when tickets available | Medium |
| **Multi-currency** | Exchange rates, localized pricing | Medium |
| **Webhooks** | Event-driven integrations | Medium |
| **Tests** | Unit + integration + e2e coverage | High |
| **CI/CD** | GitHub Actions pipeline | Medium |
| **Monitoring** | Prometheus/Grafana metrics | Low |
| **API Versioning** | `/v1/`, `/v2/` routing | Low |
| **Soft Delete Recovery** | Restore deleted users/events | Low |

### Technical Debt

| Item | Fix |
|------|-----|
| Add `isActive` to all models | Consistent soft deletes |
| Refresh token rotation | Secure token lifecycle |
| Redis connection pooling | Better connection management |
| Structured logging | JSON logs with correlation IDs |
| Database indexes audit | Optimize slow queries |

---

##  API Documentation

**Swagger UI:** `http://localhost:3000/api/docs`

### Main Endpoints

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/profile` |
| **Events** | `GET/POST /event`, `GET/PATCH /event/:id`, `PATCH /event/:id/publish\|cancel\|complete` |
| **Ticket Types** | `POST/GET /event/:eventId/ticket-types`, `PATCH/DELETE /event/ticket-types/:id` |
| **Orders** | `POST /orders`, `POST /orders/:id/pay`, `POST /orders/:id/cancel`, `GET /orders`, `GET /orders/organizer` |
| **Tickets** | `POST /tickets/:code/checkin`, `GET /tickets`, `GET /tickets/event/:eventId`, `GET /tickets/event/:eventId/checkin-stats` |
| **Reports** | `GET /reports/organizer`, `GET /reports/event/:eventId`, `GET /reports/event/:eventId/revenue` |
| **Admin** | `GET /admin/dashboard`, `GET/PATCH/DELETE /admin/users` |

---