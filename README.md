# Email Scheduling & Management System

A full-stack email scheduling and management platform designed to simplify scheduled and bulk email delivery through a reliable queue-based architecture.

The application allows users to compose emails, schedule them for future delivery, manage multiple recipients, attach files, track email status, and organize sent emails through a clean web interface.

---

## Overview

Sending multiple emails manually can become inefficient and difficult to manage, especially when emails need to be delivered at specific times.

This project addresses that problem by combining a web-based email management interface with a backend scheduling system.

A user can:

* Compose an email
* Add multiple recipients
* Select a sender
* Schedule email delivery
* Add file attachments
* View scheduled emails
* View sent emails
* Open complete email details
* Star important emails
* Archive emails
* Delete emails

Behind the interface, each email is treated as an individual background job. The backend uses **BullMQ and Redis** to manage these jobs and a background worker to process them at the appropriate time.

---

## Key Features

### Email Composition

Users can create emails by providing:

* Sender
* Recipients
* Subject
* Message body
* Attachments
* Scheduled start time

When multiple recipients are provided, the system creates separate email records and queue jobs for each recipient.

### Email Scheduling

Emails can be scheduled for a future date and time.

The scheduled time is stored in PostgreSQL and used to determine when the corresponding queue job should be processed.

### Background Job Processing

Instead of keeping the user's request open while waiting for an email to be sent, the system creates a background job using BullMQ.

The architecture follows:

```text
User
  ↓
Next.js Frontend
  ↓
Express API
  ↓
PostgreSQL
  ↓
BullMQ
  ↓
Redis
  ↓
Background Worker
  ↓
SMTP
  ↓
Email
```

This allows email processing to happen independently from the frontend request.

### Retry Handling

If an email fails during processing, the queue can retry the job automatically.

The project uses BullMQ's retry and exponential backoff capabilities to handle temporary failures.

### Rate Limiting

The system includes sender-level rate limiting to prevent excessive email processing within a short period.

It also supports spacing between email jobs to avoid sending multiple emails simultaneously.

### Email Status Management

Each email has a lifecycle that can be tracked through its status.

The main states are:

```text
scheduled
    ↓
processing
    ↓
sent
```

If processing ultimately fails:

```text
processing
    ↓
failed
```

The backend also synchronizes emails whose scheduled time has arrived so that they no longer remain in the Scheduled section.

### Attachments

Users can attach files while composing an email.

Attachments are:

* Stored in PostgreSQL
* Associated with the corresponding email
* Retrieved through a protected API endpoint
* Included when the worker sends the email

### Email Management

The application supports:

* ⭐ Star email
* 📦 Archive email
* 🗑️ Delete email
* 📄 View email details
* 📎 View attachments

---

# Application Pages

## Dashboard

The Dashboard acts as the main entry point to the application.

It provides access to the major email workflows and gives the user an overview of their email activity.

From the dashboard, users can navigate to:

* Compose
* Scheduled
* Sent
* Email details

---

## Compose

The Compose page is used to create and schedule emails.

Users can:

1. Select a sender
2. Enter recipients
3. Add a subject
4. Write the email body
5. Add attachments
6. Configure scheduling
7. Set delivery delay and limits
8. Schedule the campaign

For multiple recipients, the backend creates individual email records so each email can be processed independently.

---

## Scheduled

The Scheduled page displays emails that are waiting to be processed.

Each email shows information such as:

* Recipient
* Subject
* Scheduled time
* Current status

When the scheduled time has been reached, the backend updates the email status and it becomes available in the Sent section after the next data refresh.

---

## Sent

The Sent page contains successfully processed emails.

Users can view:

* Recipient
* Subject
* Sent time
* Email status

Sent emails can also be opened to view their complete details.

---

## Email Details

The Email Details page provides the complete information for an individual email.

It includes:

* Sender
* Recipient
* Subject
* Message body
* Scheduled time
* Sent time
* Current status
* Processing attempts
* Error information when applicable
* Attachments

Attachments can be opened through the backend attachment endpoint.

---

# Architecture

The project follows a full-stack architecture consisting of a frontend, API server, database, queue system, and background worker.

```text
                         ┌──────────────────────┐
                         │      Web Browser     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Next.js Frontend   │
                         │      React + TS      │
                         └──────────┬───────────┘
                                    │
                                  HTTP
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    Express API       │
                         │      Node.js         │
                         └───────┬───────┬──────┘
                                 │       │
                    ┌────────────┘       └─────────────┐
                    ▼                                  ▼
          ┌──────────────────┐                ┌──────────────────┐
          │   PostgreSQL     │                │      Redis       │
          │     + Prisma     │                │     + BullMQ     │
          └──────────────────┘                └────────┬─────────┘
                                                       │
                                                       ▼
                                             ┌──────────────────┐
                                             │ Background       │
                                             │ Email Worker     │
                                             └────────┬─────────┘
                                                      │
                                                      ▼
                                             ┌──────────────────┐
                                             │   SMTP / Email   │
                                             │     Service      │
                                             └──────────────────┘
```

---

# Technology Stack

## Frontend

| Technology   | Purpose                   |
| ------------ | ------------------------- |
| Next.js      | Web application framework |
| React        | UI development            |
| TypeScript   | Type-safe development     |
| CSS          | Interface styling         |
| Lucide React | UI icons                  |

## Backend

| Technology | Purpose                              |
| ---------- | ------------------------------------ |
| Node.js    | Backend runtime                      |
| Express.js | REST API                             |
| TypeScript | Type-safe backend development        |
| Prisma     | Database ORM                         |
| PostgreSQL | Persistent data storage              |
| Zod        | Environment/configuration validation |

## Queue & Background Processing

| Technology | Purpose                        |
| ---------- | ------------------------------ |
| Redis      | Queue data storage             |
| BullMQ     | Background job management      |
| Worker     | Processes scheduled email jobs |

## Email

| Technology    | Purpose                           |
| ------------- | --------------------------------- |
| Nodemailer    | SMTP email delivery               |
| Ethereal SMTP | Development/testing email service |

## Deployment

| Platform   | Purpose             |
| ---------- | ------------------- |
| Vercel     | Frontend deployment |
| Railway    | Backend deployment  |
| PostgreSQL | Production database |
| Redis      | Production queue    |

---

# Backend Architecture

The backend is separated into services based on responsibility.

A simplified structure looks like:

```text
apps/api/
│
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   ├── prisma.ts
│   │   └── redis.ts
│   │
│   ├── controllers/
│   │   ├── email.controller.ts
│   │   └── campaign.controller.ts
│   │
│   ├── integrations/
│   │   └── ethereal/
│   │       └── ethereal.client.ts
│   │
│   ├── queues/
│   │   ├── email.queue.ts
│   │   ├── email.worker.ts
│   │   └── queue-dashboard.ts
│   │
│   ├── routes/
│   │   └── email.routes.ts
│   │
│   ├── services/
│   │   ├── campaign.service.ts
│   │   ├── email.service.ts
│   │   ├── email-claim.service.ts
│   │   ├── email-recovery.service.ts
│   │   ├── email-state.service.ts
│   │   ├── rate-limit.service.ts
│   │   └── send-spacing.service.ts
│   │
│   └── worker.ts
│
└── prisma/
    └── schema.prisma
```

The purpose of separating these components is to keep database operations, queue processing, email delivery, and API handling independent and easier to maintain.

---

# Email Processing Flow

When a user schedules an email, the following process takes place.

### 1. User creates a campaign

The frontend sends the campaign information to the backend.

```text
Sender
Recipients
Subject
Body
Start Time
Delay
Hourly Limit
Attachments
```

### 2. Campaign is stored

The backend creates a campaign record in PostgreSQL.

For each recipient, an individual email record is created.

```text
Campaign
   │
   ├── Email 1 → recipient A
   ├── Email 2 → recipient B
   ├── Email 3 → recipient C
   └── Email 4 → recipient D
```

### 3. Queue jobs are created

Each email receives a BullMQ job.

The delay is calculated using the scheduled time:

```text
scheduledAt - currentTime
```

BullMQ then keeps the job delayed until it is ready.

### 4. Worker processes the job

The background worker receives the job and retrieves the corresponding email from PostgreSQL.

Before processing, the worker checks whether the email is already sent or failed.

### 5. Email is claimed

The system changes the email state to:

```text
scheduled → processing
```

This prevents multiple workers from processing the same email simultaneously.

### 6. Rate limits are checked

The worker checks:

* Sender hourly limit
* Minimum spacing between emails

If the email cannot be processed immediately, the job is delayed and rescheduled.

### 7. SMTP delivery

Once the email is ready, Nodemailer sends it through the configured SMTP service.

### 8. Status is updated

After successful delivery:

```text
processing → sent
```

The system records the `sentAt` timestamp.

If delivery ultimately fails:

```text
processing → failed
```

The error is stored for later inspection.

---

# Queue Recovery

A production system should not assume that queued jobs will always remain available.

For this reason, the project includes a queue recovery mechanism.

When the worker starts, it checks the database for emails that are still marked as `scheduled`.

If an email does not have a corresponding queue job, the worker recreates the job.

This helps recover scheduled emails after situations such as:

* Worker restart
* Server restart
* Deployment
* Temporary queue interruptions

The recovery process helps keep the database and queue state synchronized.

---

# Concurrency Protection

The system uses a database-based claiming mechanism before processing an email.

An email can be claimed when:

```text
status = scheduled
```

or when an old processing state has become stale.

Once claimed:

```text
status = processing
processingStartedAt = current time
attempts = attempts + 1
```

This reduces the possibility of duplicate processing when multiple workers or retry attempts are involved.

---

# Database

The application uses PostgreSQL through Prisma ORM.

The core email model contains fields such as:

```text
id
campaignId
senderId
recipient
subject
body
scheduledAt
sentAt
status
bullJobId
attempts
errorMessage
processingStartedAt
starred
archived
createdAt
updatedAt
```

Email attachments are stored separately and linked to their corresponding email.

The database also contains relationships between:

```text
User
  ↓
Campaign
  ↓
Email
  ↓
Attachment
```

---

# API Endpoints

The backend exposes REST endpoints for email management.

### Scheduled Emails

```http
GET /api/emails/scheduled
```

Returns the user's scheduled emails.

Supports pagination and search.

### Sent Emails

```http
GET /api/emails/sent
```

Returns successfully sent emails.

### Email Details

```http
GET /api/emails/:id
```

Returns complete information about an email.

### Star Email

```http
PATCH /api/emails/:id/star
```

Toggles the starred state.

### Archive Email

```http
PATCH /api/emails/:id/archive
```

Archives an email.

### Delete Email

```http
DELETE /api/emails/:id
```

Deletes an email.

### Attachment

```http
GET /api/emails/:id/attachments/:attachmentId
```

Returns an email attachment after authorization.

---

# Security & Reliability

The project includes several mechanisms for reliability and controlled access.

### Authentication

Protected API endpoints verify the authenticated user before accessing email data.

### User-Level Data Access

Email queries are filtered through the authenticated user's campaigns.

This prevents users from accessing emails belonging to another account.

### Environment Validation

Environment variables are validated using Zod before the backend starts.

Missing or invalid configuration causes the application to stop instead of running with an unsafe or incomplete configuration.

### Retry Strategy

BullMQ provides retry handling with exponential backoff.

### Stale Job Protection

Emails stuck in the `processing` state for too long can be reclaimed.

### Queue Recovery

Scheduled emails are checked when the worker starts to recover missing queue jobs.

---

# Project Structure

The repository is organized as a monorepo:

```text
reachinbox-scheduler/
│
├── apps/
│   │
│   ├── web/
│   │   └── Next.js frontend
│   │
│   └── api/
│       ├── src/
│       ├── prisma/
│       └── package.json
│
├── package.json
├── package-lock.json
└── README.md
```

---

# Getting Started

## Prerequisites

Make sure the following are installed:

* Node.js 18+
* npm
* PostgreSQL
* Redis

---

## Clone the Repository

```bash
git clone <your-repository-url>
cd reachinbox-scheduler
```

---

## Install Dependencies

From the root directory:

```bash
npm install
```

---

# Environment Variables

The backend requires environment variables for:

* PostgreSQL
* Redis
* Authentication
* SMTP
* Frontend URL
* Encryption
* Queue dashboard
* Optional OAuth integrations

Create the appropriate `.env` files based on the project's environment configuration.

Example:

```env
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url
FRONTEND_URL=http://localhost:3000

SESSION_SECRET=your_session_secret
ENCRYPTION_KEY=your_encryption_key

ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=your_ethereal_user
ETHEREAL_PASSWORD=your_ethereal_password
```

**Never commit real credentials, API keys, passwords, or production environment variables to GitHub.**

---

# Database Setup

Generate the Prisma client:

```bash
npx prisma generate --schema=apps/api/prisma/schema.prisma
```

Apply the database schema using the project's configured Prisma workflow.

---

# Running the Project

## Start the Frontend

```bash
cd apps/web
npm run dev
```

The frontend will run on:

```text
http://localhost:3000
```

## Start the API

```bash
cd apps/api
npm run dev
```

The API runs on the configured backend port.

## Start the Worker

In another terminal:

```bash
cd apps/api
npm run dev:worker
```

The worker is responsible for processing queued email jobs.

---

# Production Build

Build the project:

```bash
npm run build
```

Start the API:

```bash
npm run start
```

Start the worker:

```bash
npm run start:worker
```

The API and worker should run as separate processes in production.

Both services must use the same:

* PostgreSQL database
* Redis instance
* Environment configuration

---

# Deployment

The project is designed to separate the frontend and backend deployments.

### Frontend

The Next.js application can be deployed using Vercel.

### Backend

The Express API can be deployed using Railway or another Node.js hosting platform.

### Worker

The email worker should run as a separate backend process/service.

The API and worker must share the same Redis instance so that the worker can process jobs created by the API.

---

# Design Decisions

## Why BullMQ?

A normal API request is not suitable for tasks that need to happen in the future.

BullMQ provides:

* Delayed jobs
* Retries
* Backoff
* Job management
* Concurrency
* Failure handling

This makes it suitable for scheduled email processing.

## Why Redis?

BullMQ uses Redis as its underlying queue storage.

Redis provides the fast, shared state required for queue management.

## Why PostgreSQL?

PostgreSQL provides persistent relational storage for:

* Users
* Campaigns
* Emails
* Senders
* Attachments
* Email states

## Why Prisma?

Prisma provides a strongly typed interface between the TypeScript backend and PostgreSQL database.

It also makes relationships and database queries easier to manage.

## Why a Separate Worker?

Email delivery should not block the API server.

Separating the worker allows the API to remain responsive while email jobs are processed independently.

---

# Challenges & Learnings

One of the main challenges was understanding that scheduling an email is more than simply storing a future timestamp.

A reliable scheduler needs to consider:

* Delayed jobs
* Worker restarts
* Duplicate processing
* Rate limits
* Failed delivery
* Retries
* Queue recovery
* Database state synchronization

Working on this project helped me understand how a real-world asynchronous system is designed rather than treating email sending as a simple API call.

It also provided practical experience with:

* Full-stack application architecture
* REST APIs
* Database design
* Background jobs
* Redis
* Queue processing
* SMTP
* Authentication
* File handling
* Error handling
* Deployment

---

# Future Improvements

Possible improvements include:

* Real-time email status updates using WebSockets
* Rich text email editor
* Email templates
* Campaign analytics
* Delivery/open tracking
* Multiple SMTP providers
* Advanced scheduling rules
* Time-zone aware scheduling
* Distributed worker scaling
* More detailed queue monitoring
* Automated testing and integration tests

---

# Project Highlights

The project demonstrates a complete full-stack workflow:

```text
Frontend UI
     ↓
REST API
     ↓
Database
     ↓
Queue
     ↓
Redis
     ↓
Background Worker
     ↓
SMTP
     ↓
Email Delivery
```

Rather than relying only on a frontend timer or a simple database timestamp, the application uses a dedicated queue and worker architecture to handle asynchronous email processing.

---

# Author

**Aman Tez**

B.Tech Computer Science Engineering (AI & ML)

Visakhapatnam, Andhra Pradesh, India

* GitHub: https://github.com/Aman-tez-24
* LinkedIn: https://linkedin.com/in/aman-tez-a66b1234a

---

# License

This project was developed as a full-stack engineering project for learning and demonstration purposes.
