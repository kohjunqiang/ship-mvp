# Email Intention Detection System

A NestJS application that monitors user email inboxes, detects intentions using AI (Gemini, OpenAI, Claude), matches them to predefined intentions, and executes automated actions based on the detected intentions.

## Overview

This system enables businesses to automate email processing by:
1. Connecting to user email inboxes
2. Analyzing incoming emails with AI to detect intentions
3. Matching detected intentions to predefined templates
4. Extracting relevant data from emails
5. Executing appropriate actions based on the detected intention
6. Applying business rules for pricing and response handling

## Architecture

The application is structured using NestJS modules:

```
┌─────────────────┐    ┌───────────────────┐    ┌──────────────────┐
│  Admin Module   │    │   User Module     │    │   Email Module   │
│ - Manage        │    │ - User            │    │ - Email          │
│   intentions    │    │   registration    │    │   processing     │
│ - Manage        │    │ - Email           │    │ - Intention      │
│   pricing       │    │   credentials     │    │   detection      │
└─────────────────┘    └───────────────────┘    └──────────────────┘
        │                       │                         │
        └───────────────────────┼─────────────────────────┘
                               │
                     ┌───────────────────┐
                     │    AI Module      │
                     │ - Intention       │
                     │   detection       │
                     │ - Provider        │
                     │   management      │
                     └───────────────────┘
                               │
                     ┌───────────────────┐
                     │  Action Module    │
                     │ - Execute         │
                     │   intention       │
                     │   actions         │
                     └───────────────────┘
```

### Core Modules

- **User Module**: Manages user accounts and securely stores email credentials
- **Admin Module**: Allows admins to define intentions and pricing tables
- **Email Module**: Handles email fetching, processing, and scheduling
- **AI Module**: Provides an AI-agnostic interface for intention detection (currently implements Gemini)
- **Action Module**: Executes automated responses based on detected intentions

## Data Model

The system uses MongoDB with the following entity schemas:

- **User**: Email credentials and processing statistics
- **Intention**: Definitions for recognizable intentions with keywords
- **Price**: Pricing rules associated with intentions
- **Action**: Configurable actions (email, API call, etc.) to execute
- **ProcessedEmail**: Records of processed emails and their status

## Key Features

### AI-Agnostic Design

The AI module is designed to work with multiple AI providers:
- Default implementation uses Google's Gemini AI
- Interfaces for OpenAI and Claude (Anthropic) are included but not fully implemented
- Configuration allows switching between providers

### Email Processing Workflow

1. **Email Fetching** (`EmailProcessorService.fetchNewEmails`):
   - Runs every 5 minutes via CRON job
   - Fetches new emails from all active users' inboxes
   - Stores emails as unprocessed records

2. **Email Processing** (`EmailProcessorService.processEmails`):
   - Runs every 30 seconds via CRON job
   - Processes each unprocessed email:
     - Detects intention using AI
     - Matches with admin-defined intentions
     - Extracts information
     - Determines pricing
     - Executes actions

### Action Execution

The system supports multiple types of actions:
- Send Email: Send automated responses
- API Call: Integrate with external systems
- Update Record: Modify database records
- Notification: Send notifications
- Custom: Execute custom logic

Actions support variable substitution using data extracted from emails.

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB
- Google AI API key (for Gemini)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd email-intention-detection
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory
```
# Server
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/email-intention-detection

# AI Configuration
AI_DEFAULT_PROVIDER=gemini
AI_GEMINI_API_KEY=your-gemini-api-key

# Email Fetching
EMAIL_POLLING_INTERVAL=300
```

4. Start the application
```bash
npm run start:dev
```

### API Endpoints

The application provides RESTful APIs for:
- User management
- Intention configuration
- Price management
- Action configuration
- Email processing management

Visit `/api` after starting the application to access the Swagger documentation.

## Implementation Details

### Email Authentication

User email credentials are securely stored with encryption:
- Password encryption/decryption in `UserService`
- IMAP connection handling in `EmailService`

### AI Integration

The AI module provides a unified interface:
- Common input/output formats across providers
- Prompt templates for intention detection
- Structured response parsing

### Scheduled Processing

Email processing is handled by scheduled tasks:
- `@Cron` decorators for scheduled execution
- Concurrency control to prevent overlapping jobs
- Error handling for individual emails

## Example Flow

1. Admin creates an intention for "Purchase Request"
2. Admin defines actions to execute for this intention
3. User registers with their email credentials
4. System monitors the user's inbox
5. When a purchase request email arrives:
   - AI detects the intention
   - System extracts product, quantity, etc.
   - System determines pricing
   - System executes defined actions (e.g., send confirmation)

## Development

### Project Structure

```
src/
├── action/         # Action execution
├── admin/          # Intention and price management
├── ai/             # AI provider integration
│   └── providers/  # Implementation for different AI services
├── email/          # Email fetching and processing
├── schemas/        # MongoDB entity definitions
├── user/           # User management
└── config/         # Application configuration
```

### Testing

Run unit tests:
```bash
npm test
```

Run end-to-end tests:
```bash
npm run test:e2e
```

### Future Enhancements

- Full implementation of OpenAI and Claude providers
- Enhanced security with JWT authentication
- Admin dashboard for monitoring and configuration
- Support for more email providers and protocols
- Advanced intention matching algorithms