# BookMyEvent - Event Booking Platform

BookMyEvent is a full-stack event scheduling, management, and booking platform built with Next.js (App Router), TypeScript, Tailwind CSS, and MySQL via Prisma ORM.

The application features a granular role-based access control system supporting Customers, Organizers, and System Administrators, each equipped with dedicated workspaces, dashboards, and management capabilities.

---

## Key Features

### 1. Public Event Discovery & Checkout
- Search and filter active events by title, venue location, country, pincode, or date ranges.
- Sort listings by proximity, creation date, or ticket price thresholds.
- Dynamic ticket tier selection displaying seating availability, pricing summaries, and tax breakdowns.
- Horizontal Category Filter Pills Bar on the homepage with matching Lucide icons to browse events by Tech, Music, Sports, Movies, Comedy, Business, Arts, or Food & Drink categories.
- Premium active teaser media player on checkout screens supporting multiple switching video trailers (YouTube, Instagram Reels, Vimeo, and raw HTML5 video files) with selector tabs.
- Search-engine-optimized dynamic metadata layout for Event Details page and static layouts for login, register, and dashboard portals.
- **Terms & Conditions Section:** Displays a custom terms & conditions layout block on the public event details screen when configured by the organizer.
- **Real-Time Coupon Application:** Supports applying coupon codes directly at checkout, applying fixed/percentage discount deductions instantly to subtotal, recalculating tax on the discounted base, and removing coupons to restore default pricing. Enforces user-level usage limits dynamically per event or globally across events.

### 2. Onboarding & Workspace Access
- **Separated Registration:** Distinct registration flows for Attendees (`/register`) and Organizers (`/register/organizer`) to secure default privileges.
- **Signup Terms Enforcement:** Users must accept the global platform terms and conditions via a checkbox to register. Clicking the terms link opens a public terms reading page (`/terms`) in a separate browser tab.
- **Organizer Email Verification:** Organizers receive a 6-digit verification code via the configured mail dispatcher. Unverified organizers cannot create events, and accounts are automatically deleted after 24 hours of non-verification.
- **Compulsory Address Registry:** Organizers must register their address location (entity type, street address, state, zip code, country, and contact phone number). Event creation is blocked if this information is incomplete.
- **Visual Validation Layouts:** Displays warning banner blocks inside unverified or incomplete profiles.
- **Credentials Switch:** Input toggle visibility switches on password fields.

### 3. Attendee Workspace (Customer Portal)
- Comprehensive bookings transaction ledger displaying order history.
- Dynamic profile information management for email and name details.
- Secure credential management featuring change-password settings with visibility toggle buttons.
- Printable digital gate passes containing reference IDs, breakdowns of fees, and verification QR code mockups.
- Interactive booking cancellation action releasing seats back into active inventory pools.

### 4. Organizer Workspace
- Analytics dashboard presenting total revenue summaries, global ticket sales counts, event publishing stats, and fill-rate loaders.
- Managed event catalog containing listings, schedule details, locations, dynamic country dropdowns, and pincode settings.
- **Minimum Age Checks:** Enforces age verification checks during manual creation, updating, and bulk CSV uploads.
- **Event Terms & Conditions:** Supports adding customized event-level terms and conditions manually or via bulk CSV upload templates.
- **UI Consistency:** The "Age Restrictions" and "Terms & Conditions" panels are aligned inside the event specifications card on both event creation and event update panels.
- **Coupon Code Management:** Redesigned list/table view with pagination, search, status, and start/end date filters. Allows organizers to list, create, update, and delete custom coupons. Features validation checks for unique codes per organizer, status toggles, fixed/percentage discount modes, validity durations, allowed events, and custom numeric per-user usage limits (same event limit, and global across-events limit).
- Drag-and-drop/select-file local upload widget for event banners and thumbnails, storing media securely on server storage.
- Scheduling Wizard allowing organizers to configure ticket tiers with custom seat capacities, price configurations, and tax rates.
- Editor panel providing specification updates, multiple trailer video link stacks, and category selection.
- Bookings ledger representing reservation history, attendee details, seat counts, and status tracking.

### 5. Administrative Control Panel
- Global overview statistics dashboard capturing system-wide platform revenues, registered users, active listings, and ticket sales.
- Diagnostic logs and quick action widgets navigating to control modules.
- User management panel filtering profiles and executing role privileges (CUSTOMER, ORGANIZER, ADMIN).
- Event moderation interface allowing admins to audit hosted events and perform administrative removals.
- Website settings control panel allowing admins to dynamically change general branding configurations, SMTP mailers, signup terms, and security verification switches.

### 6. Dynamic Branding, Mail, & CAPTCHA Security
- **General Branding:** Dynamically updates Website Title (branding name), Website Meta Title (SEO browser tab name), Hero Headline, and Website Logo.
- **Dynamic favicon:** Automatically updates browser tab favicon to match the uploaded website logo.
- **Signup Terms Management:** Dynamic subsettings view allowing admins to enable, disable, and modify the global Terms & Conditions content for registration.
- **Dynamic SMTP Mailer:** Features a central mail dispatcher utilizing **Nodemailer** to route all platform notifications (bookings, OTPs, verifications) dynamically via any custom SMTP server (such as Mailtrap, Gmail, SES, etc.) configured in settings, falling back to the Resend API if host is default `"localhost"`.
- **Multi-Type reCAPTCHA Security:** Enables and disables secure CAPTCHA validation challenges on **Register Page** and **Forgot Password Page** supporting three distinct versions (reCAPTCHA v3 Score-Based, reCAPTCHA v2 Checkbox, reCAPTCHA v2 Invisible Badge). Performs score validation (`score >= 0.5`) for v3 and operates in Mock mode when no site keys are registered.

### 7. Multi-Currency Management & Localization
- **Curated Currency Selection:** Organizers can choose up to 5 allowed currencies and designate 1 default currency inside a dedicated settings panel.
- **Localized Symbols and Layouts:** Automatically presents dynamic localized currency symbols (e.g., `$`, `€`, `£`, `₹`) across the event discovery list, price starts from range labels, checkout receipts, and ticket booking passes.
- **Bulk CSV Upload Template:** Includes standard template downloads with currency, minimum age, and terms definitions so bulk-uploaded schedules write corresponding transactional values.

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
- Docker and Docker Compose (optional for local database container service)
- MySQL database instance

### Environment Configuration

Create a `.env` file in the root directory of the project and define the configuration variables:

```env
DATABASE_URL="mysql://book_my_event_user:userpassword@localhost:3306/book_my_event_db"
JWT_SECRET="your-jwt-secure-string"
RESEND_API_KEY="your-resend-key-if-using-email-features"

# Local MySQL Docker configuration parameters
MYSQL_ROOT_PASSWORD="rootpassword"
MYSQL_DATABASE="book_my_event_db"
MYSQL_USER="book_my_event_user"
MYSQL_PASSWORD="userpassword"
```

### Installation & Database Setup

1. Install project dependencies:
   ```bash
   npm install
   ```

2. Boot the local database container via Docker Compose:
   ```bash
   docker compose up -d
   ```

3. Execute database schema migrations using Prisma:
   ```bash
   npx prisma migrate dev
   ```

4. Populate database seeds (optional):
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
- `GET /api/events/search` - Retrieve events matching criteria parameters (title query, venue address, country, pincode, category, date ranges).
- `GET /api/events/[id]` - Retrieve details of a single event including configured seating tiers, category, structured country and pincode, and trailerUrls JSON arrays.
- `POST /api/events/create` - Schedule a new event with configurations for categories, multiple trailerUrls, country, pincode, and ticket tiers (requires ORGANIZER role privilege).
- `PUT /api/events/[id]` - Modify event specifications including categories, multiple trailerUrls, country, and pincode (requires hosting ORGANIZER owner check).
- `DELETE /api/events/[id]` - Drop owned event listing from active catalogs (requires hosting ORGANIZER owner check).
- `POST /api/events/upload` - Upload thumbnail or banner images to server storage directories (requires authenticated session).

### 4. Booking & Payments
- `GET /api/bookings` - Retrieve active purchase ledger history for logged-in CUSTOMER profiles.
- `GET /api/bookings/[id]` - Retrieve passes invoice metadata matching booking reference IDs.
- `POST /api/bookings` - Reserve seats and checkout tickets (supports optional `couponCode` parameters).
- `POST /api/bookings/[id]/cancel` - Cancel ticket reservation, releasing seating capacity.
- `POST /api/payments/webhooks` - Payment gateway callback handler updating transaction status.
- `POST /api/coupons/validate` - Validate coupon code parameters and compute discount values.

### 5. Organizer Portal
- `GET /api/organizer/dashboard` - Retrieve host indicators (revenue metrics, seatings sold global totals, hosted event counts, fill rates).
- `GET /api/organizer/events` - Retrieve catalog listings owned by host organizer.
- `GET /api/organizer/bookings` - Audit registration log sheet matching reservations made across organizer's events.
- `GET /api/organizer/coupons` - List coupons created by the organizer.
- `POST /api/organizer/coupons` - Create a new coupon.
- `PUT /api/organizer/coupons/[id]` - Update an existing coupon details.
- `DELETE /api/organizer/coupons/[id]` - Delete a coupon.

### 6. Administration Control
- `GET /api/admin/dashboard` - Query global system-wide revenue turnover, ticket counts, registry accounts, and active listings.
- `GET /api/admin/users` - Retrieve platform user directory with database search filters (requires ADMIN role).
- `PATCH /api/admin/users/[id]/role` - Overrides user privilege roles CUSTOMER / ORGANIZER / ADMIN (requires ADMIN role).
- `DELETE /api/admin/events/[id]` - Administrative force-delete event listings violating safety guidelines (requires ADMIN role).
- `GET /api/admin/settings` - Retrieve website control settings details for General, SMTP, and Captcha configs (requires ADMIN role).
- `PUT /api/admin/settings` - Save changes made to general branding, SMTP parameters, or security CAPTCHA preferences (requires ADMIN role).

### 7. Public Configuration Settings
- `GET /api/settings` - Returns public settings metadata (Website Title, Meta Title, Logo Image URL, Hero Headline, Captcha active types/keys, and Signup Terms details) for guest Discovery layouts and Auth pages.

### 8. Custom Currency Configurations
- `GET /api/organizer/settings/currency` - Fetch allowed currencies and default selected values configured on active profile.
- `PUT /api/organizer/settings/currency` - Save modified arrays of preferred allowed currencies and set single default preferences.

### 9. Organizer Verification & Address Details
- `GET /api/auth/verify-email` - Validate 6-digit verification token for organizer registration.
- `GET /api/organizer/settings/address` - Retrieve the registered address location details.
- `PUT /api/organizer/settings/address` - Upsert (create or update) the organizer's address registry information.

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
