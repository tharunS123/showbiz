---
name: db-schema
description: Use when working with Prisma schema, database migrations, or DB access helpers in lib/db/. Provides the canonical Prisma schema and query patterns for Showbiz.
---

# DB Schema Skill

## Canonical Prisma schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth.js required tables ────────────────────────────────
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())

  accounts      Account[]
  sessions      Session[]
  listItems     ListItem[]
  interactions  InteractionEvent[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// ─── Showbiz domain tables ──────────────────────────────────
model ListItem {
  id          String    @id @default(cuid())
  userId      String
  externalId  String                         // TMDb ID
  mediaType   MediaType
  listType    ListType
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, externalId, mediaType, listType])
  @@index([userId, listType])
}

model InteractionEvent {
  id          String    @id @default(cuid())
  userId      String
  eventType   EventType
  externalId  String?
  mediaType   MediaType?
  timestamp   DateTime  @default(now())
  context     Json?                          // page, referrer, ranking source, etc.

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, eventType])
  @@index([userId, timestamp])
}

// ─── Enums ──────────────────────────────────────────────────
enum MediaType {
  movie
  tv
}

enum ListType {
  watchlist
  favorite
  seen
}

enum EventType {
  view_title
  view_person
  search
  search_click
  add_watchlist
  remove_watchlist
  favorite
  unfavorite
  mark_seen
  unmark_seen
  rec_impression
  rec_click
  rec_why_open
}
```

## DB helper patterns

```typescript
// lib/db/list.ts
import { prisma } from './client'
import type { MediaType, ListType } from '@prisma/client'

export async function getUserList(userId: string, listType: ListType) {
  return prisma.listItem.findMany({
    where: { userId, listType },
    orderBy: { createdAt: 'desc' },
  })
}

export async function addListItem(userId: string, externalId: string, mediaType: MediaType, listType: ListType) {
  return prisma.listItem.upsert({
    where: { userId_externalId_mediaType_listType: { userId, externalId, mediaType, listType } },
    create: { userId, externalId, mediaType, listType },
    update: {},  // no-op if already exists
  })
}

export async function removeListItem(userId: string, externalId: string, mediaType: MediaType, listType: ListType) {
  return prisma.listItem.deleteMany({
    where: { userId, externalId, mediaType, listType },
  })
}

export async function getUserListStatus(userId: string, externalId: string, mediaType: MediaType) {
  const items = await prisma.listItem.findMany({
    where: { userId, externalId, mediaType },
    select: { listType: true },
  })
  return {
    watchlist: items.some(i => i.listType === 'watchlist'),
    favorite:  items.some(i => i.listType === 'favorite'),
    seen:      items.some(i => i.listType === 'seen'),
  }
}
```

```typescript
// lib/db/interactions.ts
import { prisma } from './client'
import type { EventType, MediaType } from '@prisma/client'

export async function logInteraction(
  userId: string,
  eventType: EventType,
  opts?: { externalId?: string; mediaType?: MediaType; context?: Record<string, unknown> }
) {
  return prisma.interactionEvent.create({
    data: { userId, eventType, ...opts },
  })
}

export async function getUserSignals(userId: string, since: Date) {
  return prisma.interactionEvent.findMany({
    where: { userId, timestamp: { gte: since } },
    orderBy: { timestamp: 'desc' },
    take: 500,   // cap for recs engine input
  })
}
```

## User data deletion (GDPR / privacy)

```typescript
// lib/db/user.ts
export async function deleteUserData(userId: string) {
  await prisma.$transaction([
    prisma.interactionEvent.deleteMany({ where: { userId } }),
    prisma.listItem.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ])
}
```
