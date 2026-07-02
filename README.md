# BookMyEvent - Event Booking Platform

BookMyEvent is a full-stack event scheduling, management, and booking platform built with Next.js (App Router), TypeScript, Tailwind CSS, and MySQL via Prisma ORM.

The application features a granular role-based access control system supporting Customers, Organizers, and System Administrators, each equipped with dedicated workspaces, dashboards, and management capabilities.

---

## Key Features

### 1. Public Event Discovery & Checkout
- Search and filter active events by title, venue location, or date ranges.
- Sort listings by proximity, creation date, or ticket price thresholds.
- Dynamic ticket tier selection displaying seating availability, pricing summaries, and tax breakdowns.
- Secure, authenticated booking process for client reservation checkouts.

### 2. Attendee Workspace (Customer Portal)
- Comprehensive bookings transaction ledger displaying order history.
- Dynamic profile information management for email and name details.
- Secure credential management featuring change-password settings with visibility toggle buttons.
- Printable digital gate passes containing reference IDs, breakdowns of fees, and verification QR code mockups.
- Interactive booking cancellation action releasing seats back into active inventory pools.

### 3. Organizer Workspace
- Analytics dashboard presenting total revenue summaries, global ticket sales counts, event publishing stats, and fill-rate loaders.
- Managed event catalog containing listings, schedule details, locations, and configured ticket tiers.
- Scheduling Wizard allowing organizers to configure ticket tiers with custom seat capacities, price configurations, and tax rates.
- Editor panel providing specification updates and ticket configuration alterations.
- Registration log ledger representing booking history, attendee details, seat counts, and status tracking.

### 4. Administrative Control Panel
- Global overview statistics dashboard capturing system-wide platform revenues, registered users, active listings, and ticket sales.
- Diagnostic logs and quick action widgets navigating to control modules.
- User management panel filtering profiles and executing role privileges (CUSTOMER, ORGANIZER, ADMIN).
- Event moderation interface allowing admins to audit hosted events and perform administrative removals.

---

## Technical Stack & Architecture

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS, Lucide icons.
- **Backend API:** Next.js Route Handlers.
- **Database Layer:** MySQL database managed via Prisma Client.
- **Authentication & Security:** Custom token-based authentication verified through proxy middleware in `src/proxy.ts`. Route contexts are forwarded via custom headers (`x-user-id`, `x-user-role`).

---

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- MySQL database instance

### Environment Configuration

Create a `.env` file in the root directory of the project and define the following variables:

```env
DATABASE_URL="mysql://username:password@localhost:3306/book_my_event"
JWT_SECRET="your-jwt-secure-string"
```

### Installation & Database Setup

1. Install project dependencies:
   ```bash
   npm install
   ```

2. Execute database schema migrations using Prisma:
   ```bash
   npx prisma migrate dev
   ```

3. Populate database seeds (optional):
   ```bash
   npm run seed
   ```

### Running the Application

Start the local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser to access the application.

---

## API Endpoints Reference

### 1. Authentication & Security
- `POST /api/auth/register` - Create a new user account profile.
- `POST /api/auth/login` - Authenticate account credentials and establish session cookies.
- `POST /api/auth/logout` - Expire active authentication session cookies.
- `GET /api/auth/me` - Retrieve current logged-in user context.
- `POST /api/auth/change-password` - Modify active passwords (requires validation of current credentials).
- `POST /api/auth/forgot-password` - Trigger an email-based credential OTP reset dispatch.
- `POST /api/auth/reset-password` - Set new password details using validated token parameters.

### 2. User Profiles
- `GET /api/users/profile` - Retrieve current user profile details.
- `PUT /api/users/profile` - Modify active account name and email address configurations.

### 3. Events Catalogue
- `GET /api/events/list` - Retrieve published upcoming events.
- `GET /api/events/search` - Retrieve events matching criteria parameters (title query, venue address, date ranges).
- `GET /api/events/[id]` - Retrieve details of a single event including configured seating tiers and host organizer.
- `POST /api/events/create` - Schedule a new event with multiple ticket tiers (requires ORGANIZER role privilege).
- `PUT /api/events/[id]` - Modify event specifications and rebuild ticket structures (requires hosting ORGANIZER owner check).
- `DELETE /api/events/[id]` - Drop owned event listing from active catalogs (requires hosting ORGANIZER owner check).
- `POST /api/events/upload` - Upload thumbnail or banner images to server storage directories (requires authenticated session).

### 4. Booking & Payments
- `GET /api/bookings` - Retrieve active purchase ledger history for logged-in CUSTOMER profiles.
- `GET /api/bookings/[id]` - Retrieve passes invoice metadata matching booking reference IDs.
- `POST /api/bookings` - Reserve seats and checkout tickets.
- `POST /api/bookings/[id]/cancel` - Cancel ticket reservation, releasing seating capacity.
- `POST /api/payments/webhooks` - Payment gateway callback handler updating transaction status.

### 5. Organizer Portal
- `GET /api/organizer/dashboard` - Retrieve host indicators (revenue metrics, seatings sold global totals, hosted event counts, fill rates).
- `GET /api/organizer/events` - Retrieve catalog listings owned by host organizer.
- `GET /api/organizer/bookings` - Audit registration log sheet matching reservations made across organizer's events.

### 6. Administration Control
- `GET /api/admin/dashboard` - Query global system-wide revenue turnover, ticket counts, registry accounts, and active listings.
- `GET /api/admin/users` - Retrieve platform user directory with database search filters (requires ADMIN role).
- `PATCH /api/admin/users/[id]/role` - Overrides user privilege roles CUSTOMER / ORGANIZER / ADMIN (requires ADMIN role).
- `DELETE /api/admin/events/[id]` - Administrative force-delete event listings violating safety guidelines (requires ADMIN role).

---

## Build and Deployment

To compile the optimized production bundle:
```bash
npm run build
```

To run the production bundle locally:
```bash
npm run start
```
