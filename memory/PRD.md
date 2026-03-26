# Unora - Product Requirements Document

## Overview
Unora is a private, invite-only group planning app designed to help small groups of friends fairly decide when and where to meet offline.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend:** FastAPI, Motor (async MongoDB driver), Pydantic
- **Database:** MongoDB
- **Auth:** Emergent-managed Google Auth
- **AI:** OpenAI GPT-5.2 via Emergent LLM Key
- **Deployment:** Emergent Platform (Kubernetes)

## Core Features (All Implemented)
1. Google Authentication (Emergent-managed)
2. Group creation (3-10 members) with city/country
3. Invite links with unique member tokens
4. Member preference collection (interests, budget, availability)
5. AI-generated balanced activity suggestions (GPT-5.2)
6. Plan lifecycle: Generate -> Accept -> Complete
7. Moments: private memory keeping with photo uploads and lightbox
8. Dashboard: "My Groups" view for creator + member groups
9. Demo Mode (`/demo`): seeded data showcase, no setup needed
10. Responsive layout (mobile-first, tablet/desktop)

## Key Pages
- `/` - Landing page
- `/demo` - Demo showcase with seeded group data
- `/invite/:groupId/:memberToken` - Invite + preferences page
- `/dashboard` - User's groups
- `/create-group` - New group form
- `/groups/:groupId` - Group detail + plan + moments
- `/groups/:groupId/plan` - Plan display
- `/groups/:groupId/moments/:momentId` - Moment detail

## DB Schema
- `groups`: `{group_id, name, city, country, creator_user_id, is_demo, members[], current_plan, created_at}`
- `moments`: `{moment_id, group_id, plan_data, media[], caption, created_at}`
- `users`: `{user_id, email, name, picture, created_at}`
- `user_sessions`: `{user_id, session_token, expires_at, created_at}`

## What's Been Implemented
- [x] Full app structure and UI components
- [x] Emergent Google Auth integration
- [x] Group creation and invite links
- [x] Member preference collection
- [x] AI Plan Generation (GPT-5.2)
- [x] Moments feature with media upload/lightbox/deletion
- [x] Responsive layout for all screen sizes
- [x] Demo Mode with seeded data
- [x] MongoDB ObjectId serialization fixes
- [x] Fixed 404 invite link bug (demo data seeding + ensure_demo_data helper)
- [x] Improved error handling: retry/fallback UI on invite and demo pages
- [x] Demo page uses React Router navigate() for smooth transitions

## Backlog / Future
- No additional features explicitly requested
- Potential: notification system, recurring plans, group chat
