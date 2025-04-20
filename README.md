Channel-Agnostic Intention Detection System
Technical Overview
The Intention Detection System is a modular, event-driven platform designed to process incoming communications across multiple channels, detect semantic intentions through AI, and execute configurable workflows based on those intentions. The system uses a graph-based workflow engine to chain actions and intentions, with Terminal Actions representing concrete integrations with external systems.
System Architecture
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Channel Layer  │    │  Core Engine     │    │  Integration Layer│
│ - Email          │    │ - Intention      │    │ - API Connectors  │
│ - SMS            │--->│   Detection      │--->│ - Calendar        │
│ - Voice          │    │ - Workflow       │    │ - CRM             │
│ - Chat           │    │   Execution      │    │ - Task Management │
└──────────────────┘    └──────────────────┘    └──────────────────┘
Key Components
1. Backend (NestJS)

Channel Adapters: Modular connectors for various communication channels

Message normalization to a standard format
Channel-specific metadata extraction
Bidirectional communication support


AI Module:

Provider-agnostic interface for AI services
Implementations for Gemini, OpenAI, Claude
Structured response parsing and validation
Dynamic prompt templating with variable substitution


Workflow Engine:

Directed acyclic graph execution of intention-action chains
Context management and data persistence between workflow steps
Conditional path selection based on AI output
Execution history and state tracking


Terminal Action Framework:

Pluggable architecture for response execution
Support for synchronous and asynchronous operations
Retry logic and failure handling
Result validation and post-processing


Data Store (MongoDB):

Schema design supporting complex workflows
Intention and action definitions
Processing history and analytics
System configuration and credentials



2. Frontend (Next.js)

Admin Interface:

Intention configuration (keywords, AI parameters)
Action definition (AI prompts, workflow connections)
Workflow visualization and testing


Monitoring Dashboard:

Real-time processing statistics
Channel-specific metrics
Intention distribution analytics
Terminal action success rates


Development Tools:

Workflow testing framework
AI prompt playground
Log viewer and debug tools



Data Model
Core Entities

Message: Normalized representation of a communication from any channel

Source channel metadata
Content (text, transcribed audio)
Attachments and structured data


Intention: Semantic categorization pattern

Detection keywords and patterns
AI configuration (threshold, tokens, temperature)
Context mapping configuration
Associated actions


Action: Processing step definition

AI prompt template
Expected output format
Result handling (next intention or terminal action)
Execution configuration


Workflow: Runtime execution of intention-action chains

Execution graph
Processing state
Context data
Execution history



Technical Specifications
Backend

Framework: NestJS (Node.js)
Database: MongoDB with Mongoose ODM
AI Integration: REST API clients for provider services
Messaging: Event-driven architecture with optional message queue
API: RESTful endpoints with OpenAPI documentation
Authentication: JWT-based with role permissions
Testing: Jest for unit/integration tests

Frontend

Framework: Next.js 14 with App Router
State Management: React Query for server state, Context API for local state
UI Components: Custom components with shadcn/ui
Data Visualization: Recharts for analytics, React Flow for workflow visualization
API Integration: Axios with query/mutation hooks
Authentication: NextAuth.js for session management

Implementation Details
AI Processing Pipeline
Input Message → Preprocessing → Intention Detection → Information Extraction → Action Selection → Action Execution → Terminal Action
Workflow Execution

Initialization: Create workflow context with message data
Intention Detection: Identify the primary intention
Context Preparation: Map extracted data to action context
Action Execution: Process the action with AI prompt
Path Selection: Determine next step based on action result
Terminal Execution: Perform final concrete action
Response Tracking: Record results and analytics

Scalability Considerations

Horizontal scaling via containerization (Docker/Kubernetes)
Background processing for long-running workflows
Caching for frequent AI prompts and responses
Rate limiting for external API calls
Message queue for asynchronous processing

Developer Integration
Adding New Channels

Implement the ChannelAdapter interface
Create normalization functions for channel-specific formats
Register the adapter in the channel registry
Configure channel-specific metadata extraction

Creating Terminal Actions

Implement the TerminalAction interface
Define input schema and validation rules
Implement execution logic
Register in the terminal action registry

Extending AI Capabilities

Implement the AIProvider interface
Configure provider-specific parameters
Add response parsing for structured outputs
Register the provider in the AI module