# Youvit Affiliate Control Panel

A comprehensive WhatsApp-based affiliate management system built with Next.js 15, designed to streamline communication and management of Youvit's affiliate network.

## 🚀 Features

### 📊 Dashboard & Analytics

- **Real-time Metrics**: Track active affiliates, new registrations, and scheduled messages
- **Quick Actions**: Direct access to broadcast, template creation, and scheduling
- **Status Monitoring**: WhatsApp connection status and system health

### 👥 Affiliate Management

- **Onboarding System**: Process new affiliate registrations with welcome messages
- **Active Affiliates**: Manage and view all active affiliate contacts
- **Google Sheets Integration**: Automatic sync with affiliate registration forms

### 📱 WhatsApp Messaging

- **Template-Based Broadcasting**: Create reusable message templates with dynamic parameters
- **Bulk Messaging**: Send personalized messages to multiple affiliates
- **Smart Scheduling**: One-time and recurring message schedules
- **Auto-Personalization**: Dynamic name insertion and contact-specific data

### 📝 Template System

- **Rich Templates**: Support for bold text, links, and dynamic parameters
- **Parameter Management**: Static and dynamic parameter handling
- **Category Organization**: Organize templates by marketing, onboarding, education, etc.
- **Real-time Preview**: Live preview of formatted messages

### ⏰ Advanced Scheduling

- **Flexible Scheduling**: Daily, weekly, monthly recurring schedules
- **Cron-based System**: Powerful scheduling with cron expressions
- **Schedule Management**: View, edit, pause, and cancel scheduled messages
- **Execution History**: Track delivery success and failure rates

## 🛠 Tech Stack

### Frontend

- **Next.js 15** with App Router
- **React 19** with Server Components
- **Tailwind CSS v4** with Lightning CSS
- **TypeScript** (strict mode)

### Backend

- **Prisma ORM** with PostgreSQL
- **Google Sheets API** for affiliate data
- **WAHA API** for WhatsApp integration
- **Node-cron** for scheduling

### UI Components

- **shadcn/ui** components
- **Lucide React** icons
- **Sonner** for notifications
- **Custom design system**

## 📋 Prerequisites

- **Node.js** 18+ and npm/yarn
- **PostgreSQL** database
- **Google Sheets API** credentials
- **WAHA WhatsApp API** server
- **Admin credentials** for authentication

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd youvit-affiliate-control-panel
npm install
```

### 2. Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/youvit_affiliate"

# Authentication
ADMIN_USERNAME="your_admin_username"
ADMIN_PASSWORD="your_secure_admin_password"

# Google Sheets Integration
GOOGLE_SHEETS_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_DOCUMENT_ID="your_google_sheets_document_id"

# WhatsApp (WAHA API)
NEXT_PUBLIC_WAHA_API_URL="https://your-waha-server.com"
NEXT_PUBLIC_WAHA_SESSION="your_session_name"
NEXT_PUBLIC_WAHA_API_KEY="your_api_key" # Optional

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 4. Google Sheets Setup

1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create a Service Account and download credentials
4. Share your Google Sheet with the service account email
5. Ensure your sheet has these tabs:
   - `Form Responses 1` (affiliate registrations)
   - `Broadcast Log` (message history)

### 5. WAHA WhatsApp Setup

1. Deploy WAHA server (see [WAHA documentation](https://waha.devlike.pro/))
2. Create a WhatsApp session
3. Scan QR code to authenticate
4. Configure the session name in environment variables

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Access the application at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── affiliates/       # Affiliate management
│   │   ├── auth/             # Authentication
│   │   ├── messages/         # WhatsApp messaging
│   │   ├── schedules/        # Message scheduling
│   │   └── templates/        # Template management
│   ├── contacts/             # Affiliate pages
│   ├── dashboard/            # Main dashboard
│   ├── login/                # Authentication
│   └── messages/             # Messaging features
├── components/               # React components
│   ├── molecules/            # Compound components
│   ├── organisms/            # Complex components
│   ├── templates/            # Page templates
│   └── ui/                   # Base UI components
├── hooks/                    # Custom React hooks
├── lib/                      # Utility libraries
│   ├── auth/                 # Authentication logic
│   ├── config/               # Configuration
│   ├── schedules/            # Scheduling system
│   ├── sheets/               # Google Sheets integration
│   ├── templates/            # Template processing
│   └── whatsapp/             # WhatsApp integration
└── middleware.js             # Next.js middleware
```

## 🔑 Key Features Deep Dive

### Affiliate Onboarding Flow

1. **Registration**: Affiliates fill Google Form
2. **Processing**: Admin reviews new registrations
3. **Welcome Message**: Automated welcome message with sample request
4. **Status Tracking**: Move affiliates from "new" to "contacted"

### Template System

- **Dynamic Parameters**: `{name}`, `{phone}` automatically filled from contact data
- **Static Parameters**: Custom fields like `{promo_code}`, `{discount}`
- **Rich Formatting**: **Bold**, _italic_, and clickable links
- **Categories**: Organize by marketing, onboarding, education, etc.

### Scheduling System

- **One-time**: Send at specific date and time
- **Recurring**: Daily, weekly, monthly patterns
- **Cron Support**: Advanced scheduling with cron expressions
- **Timezone Aware**: Handles Jakarta timezone (Asia/Jakarta)

### Google Sheets Integration

```
Form Responses 1 Sheet Columns:
- Timestamp
- Isi nama kamu (Name)
- Nomor WhatsApp (Phone)
- Lebih aktif sebagai Affiliate di mana? (Platform)
- Username Instagram/TikTok/Shopee
- Status (contacted/blank)
```

## 🔐 Authentication & Security

### Simple Authentication System

- **Environment-based**: Admin credentials in `.env`
- **Session Management**: HTTP-only cookies
- **Middleware Protection**: All routes except login protected
- **Logout Functionality**: Secure session termination

### Security Features

- **Input Validation**: Prisma schema validation
- **SQL Injection Protection**: Prisma ORM safety
- **XSS Prevention**: React built-in protections
- **CSRF Protection**: Next.js built-in middleware

## 📱 WhatsApp Integration

### Message Types

- **Text Messages**: Rich formatting support
- **Bulk Broadcasting**: Rate-limited sending (3-5 second delays)
- **Personalized Content**: Dynamic parameter replacement

### Phone Number Formatting

```javascript
// Automatic formatting
"08123456789" → "628123456789@c.us"
"+628123456789" → "628123456789@c.us"
"628123456789" → "628123456789@c.us"
```

### Rate Limiting

- **Configurable Delays**: 3-5 seconds between messages
- **Session Monitoring**: Connection status checking
- **Error Handling**: Retry logic and failure tracking

## 🛠 API Endpoints

### Affiliates

- `GET /api/affiliates` - List affiliates (by status)
- `POST /api/affiliates/update-status` - Update affiliate status

### Messages

- `POST /api/messages` - Send single message
- `POST /api/messages/bulk` - Send bulk messages

### Templates

- `GET /api/templates` - List all templates
- `POST /api/templates` - Create new template
- `PUT /api/templates/[id]` - Update template
- `DELETE /api/templates/[id]` - Delete template

### Schedules

- `GET /api/schedules` - List all schedules
- `POST /api/schedules` - Create new schedule
- `PUT /api/schedules/[id]` - Update schedule
- `DELETE /api/schedules/[id]` - Delete schedule

## 🎯 Usage Guide

### 1. Setting Up Your First Template

1. Navigate to **Messages → Templates**
2. Click **"New Template"**
3. Fill in name, category, and content
4. Use `{name}` for automatic name insertion
5. Add custom parameters like `{promo_code}`
6. Save and test with preview

### 2. Sending Your First Broadcast

1. Go to **Messages → Broadcast**
2. Select your template
3. Fill in any required parameters
4. Choose recipients (contacts or manual numbers)
5. Send immediately or schedule for later

### 3. Managing Affiliates

1. **Onboarding**: Visit **Contacts → Onboarding**
2. Review new registrations from Google Sheets
3. Send welcome messages to approve affiliates
4. **Active Management**: Visit **Contacts → Affiliates**

### 4. Setting Up Recurring Messages

1. Create a template for regular communication
2. Go to **Messages → Broadcast**
3. Choose "Schedule" option
4. Select "Recurring" type
5. Set frequency (daily/weekly/monthly)
6. Configure start and end dates

## 🔧 Configuration

### Tailwind CSS v4 Setup

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

/* Custom design tokens */
:root {
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  /* ... more design tokens */
}
```

### Database Schema (Prisma)

```prisma
model Template {
  id          Int         @id @default(autoincrement())
  name        String
  content     String
  category    String?
  parameters  Parameter[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Schedule {
  id            Int      @id @default(autoincrement())
  name          String
  templateId    Int
  scheduleType  String   // "once" | "recurring"
  cronExpression String?
  scheduledDate DateTime?
  status        String   @default("active")
  // ... more fields
}
```

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic CI/CD

### Self-Hosted Deployment

```bash
# Build the application
npm run build

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "youvit-affiliate" -- start
```

### Database Migration for Production

```bash
# Deploy migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

## 🐛 Troubleshooting

### Common Issues

**WhatsApp Connection Issues**

```bash
# Check WAHA server status
curl https://your-waha-server.com/api/sessions

# Verify session is authenticated
curl https://your-waha-server.com/api/sessions/your_session
```

**Database Connection Issues**

```bash
# Test database connection
npx prisma db pull

# Reset database if needed
npx prisma migrate reset
```

**Google Sheets API Issues**

- Verify service account email has access to sheet
- Check if Google Sheets API is enabled
- Validate JSON key format in environment variables

**Scheduling Issues**

- Check server timezone configuration
- Verify cron expression format
- Review scheduler service logs

## 📈 Performance Optimization

### Recommended Settings

- **Database**: Connection pooling with PgBouncer
- **Caching**: Redis for session management
- **CDN**: Vercel Edge Network or CloudFlare
- **Monitoring**: Sentry for error tracking

### Rate Limiting

```javascript
// Recommended WhatsApp message intervals
const delays = {
  small: 3000, // < 10 recipients
  medium: 5000, // 10-50 recipients
  large: 8000, // > 50 recipients
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use Prettier for code formatting
- Write meaningful commit messages
- Add JSDoc comments for complex functions
- Test WhatsApp integration thoroughly

## 📄 License

This project is proprietary software for Youvit affiliate management. All rights reserved.

## 🆘 Support

For technical support or questions:

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **WhatsApp Integration**: Refer to [WAHA documentation](https://waha.devlike.pro/)
- **Google Sheets**: See [Google Sheets API docs](https://developers.google.com/sheets/api)

---
