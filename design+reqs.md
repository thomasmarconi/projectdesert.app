# Project Desert: Design & Requirements

## Architecture Summaries

### 🎯 Backend architecture
| Component | Purpose |
| :--- | :--- |
| **FastAPI HTTP app** | REST API, business logic, Celery triggers |
| **Celery workers** | Long-running jobs, workflows |
| **Redis** | WebSockets → Redis Pub/Sub (fast, realtime)<br>Celery → Redis Streams broker (reliable) |
| **WebSocket server (FastAPI)** | Maintains user connections, rooms, broadcasts Redis messages |

### 🚀 Frontend architecture
| Component | Purpose |
| :--- | :--- |
| **Next.js** | App router for pages |
| **React** | Dynamic State management |
| **TanStack Query** | Client caching of component state and updating |
| **Typescript** | Tight typing coupling with data models |
| **shad/cn** | Component library |
| **Tailwind CSS** | Easy component styling |

### 📊 Database architecture
| Component | Purpose |
| :--- | :--- |
| **Prisma ORM** | Database schema migrations, typescript interface generation, api ORM manager |
| **Postgresql** | Relational database store |

---

## �️ Technical Design & Logic

### 🏛️ Data Schema (Proposed)
The system will use a relational schema via Prisma to manage the complex interactions between users, groups, and gamification states.
- **Core Entities**: `User`, `AccountabilityGroup`, `ActivityLog`, `SaintMosaic`, `Nudge`.
- **Relationships**: 
  - Users have many ActivityLogs and belong to multiple Groups.
  - Groups share a `SaintMosaic` progress for collective rewards.
  - `Nudge` records track peer-to-peer interactions for the notification system.

### 🧩 Stained Glass Mosaic Mechanism
The mosaic is the central gamification element.
- **Visual Representation**: Multi-layered SVG where each `<path>` represents a piece.
- **Logic**:
  - Each task completion unlocks 1 piece (randomly or sequentially).
  - Streaks (7+ days) unlock "Mastery" pieces (special colors/animations).
  - Metadata for mosaics (SVG path data and labels) will be stored in the database.

### 🔔 Nudge & Real-Time Flow
- **Nudge Types**: `Encouragement`, `Reminder`, `Kudos`.
- **Infrastructure**: FastAPI WebSockets + Redis Pub/Sub. When a nudge is sent, the backend publishes to a Redis channel unique to the recipient. The recipient's active WebSocket connection receives the broadcast and triggers a UI notification.

### 🧠 AI Behavioral Insights Path
- **Process**: Weekly background jobs (Celery) analyze user activity logs.
- **Model**: Simple correlation analysis (and eventually ML) to identify patterns (e.g., "Logging a morning fast correlates with a 90% success rate for evening prayer").
- **Delivery**: Insights are pushed to the user's dashboard as actionable advice.

### 📖 Spiritual Tracks (User-Generated Content)
A robust system for users to build and share spiritual programs.
- **Privacy Model**: Users can toggle tracks as `Private` (only visible to them or invited groups) or `Published` (visible in a global marketplace/gallery).
- **Module Structure**: Tracks are composed of `Modules` (e.g., sequential days). Each module contains multiple `ContentItems`.
- **Content Types**:
  - **Readings**: Markdown-rendered text for spiritual teaching or scripture.
  - **Videos**: Deeply integrated video links (YouTube/Vimeo) with inline playback.
  - **Reflections**: Structured questions that prompt journaling or group discussion.

---

## 🔍 Detailed Requirement Breakdown

### R-101: Daily tracking of asceticism activities
- **Description**: Users can log their daily asceticism activities (fasting, prayer, penance, etc.).
- **Details**: Requires a logging system with timestamps and activity types. Data must be persisted in a relational database.

### R-102: Daily quote from the Desert Fathers
- **Description**: Pull and display a daily inspirational quote from the Desert Fathers.
- **Details**: Requires an external API or a local database of quotes. Implement caching to avoid redundant requests.

### R-103: Saint of the day story
- **Description**: Provide a story or biographical sketch of the saint of the day based on the Roman Missal calendar.
- **Details**: Integration with a liturgical calendar API. Highly important for user engagement.

### R-104: Liturgy of the Hours (LOTH)
- **Description**: A dedicated section for the text of the Liturgy of the Hours.
- **Details**: Requires sourcing LOTH texts via API or structured data files.

### R-105: Content tracks (Scripture/Reflections)
- **Description**: Create specific tracks of content centered around scripture or spiritual reflections.
- **Details**: Likely requires a CMS or an internal tool for admins to manage these tracks.

### S-106: Vice/Root Sin Tracking
- **Description**: Allow users to identify a primary vice they are working on and track progress against it.
- **Details**: Link tracking logs from R-101 to these specific vices for better visualization.

### S-107: Streak Counts and Progress Charts
- **Description**: Visual representation of user consistency through streaks and charts.
- **Details**: Frontend logic and components for data visualization (e.g., Recharts or similar).

### S-108: Guided Daily Examination of Conscience (Examen)
- **Description**: A structured flow to guide users through a daily Examen.
- **Details**: Journaling interface with prompts.

### S-109: Daily Mass Readings & Reflections
- **Description**: Integration of mass readings and a prompt for reflection.
- **Details**: Use a liturgical API and implement caching.

### S-110: Categories for Asceticism Activities
- **Description**: Allow users to categorize their activities (e.g., Diet, Prayer, Work).
- **Details**: Schema update for R-101 logs to include category tags.

### S-111: Daily Check-ins & Weekly Reflections
- **Description**: One-tap daily check-in questions and detailed weekly reflection prompts.
- **Details**: Quick check-in system for immediate data entry; structured journaling interface for weekly reviews to facilitate deeper spiritual growth.

### R-201: User Collaboration/Interaction
- **Description**: High-level requirement for social features.
- **Details**: Umbrella for group formation and messaging.

### R-202: Accountability Groups
- **Description**: Users can join or create groups for mutual accountability.
- **Details**: Relationship tables in Postgres (Many-to-Many).

### R-203: In-app Messaging
- **Description**: Real-time communication between users in groups or direct messages.
- **Details**: Use WebSockets and Redis Pub/Sub via FastAPI.

### R-204: Email Notifications
- **Description**: Triggered emails for group activity or reminders.
- **Details**: Celery tasks integrating with an ESP like SendGrid.

### S-205: Virtual Prayer Wall
- **Description**: A place for users to post prayer intentions and for others to "commit" to praying for them.
- **Details**: Real-time updates and intentional logging.

### S-206: Mentor/Spiritual Director Role
- **Description**: A specific user role that can view (but not edit) the progress of another user.
- **Details**: Complex permission logic (RBAC).

### S-207: Group Challenges/Dashboards
- **Description**: Aggregated data for accountability groups to show collective progress.
- **Details**: Group-level reporting queries.

### R-208: User Nudges
- **Description**: Ability to send "nudges" to group members or accountability partners.
- **Details**: Integration with the notification system (WebSockets/Push) to send lightweight prompts/reminders to peers, encouraging engagement and consistency.

### R-301: Next.js/TypeScript/React Stack
- **Description**: Core frontend technology stack.
- **Details**: Modern, type-safe, and performant frontend development.

### R-302: Python FastAPI Backend
- **Description**: Core backend technology stack.
- **Details**: High-performance asynchronous API development using Python.

### R-303: WebSockets for Real-time
- **Description**: Implementation of real-time features.
- **Details**: Essential for messaging and live updates.

### R-304: Structured RDBMS (Postgres)
- **Description**: Choice of database system.
- **Details**: Ensures data integrity and supports complex relational queries.

### R-305: Scalable Deployment (Cloud Run)
- **Description**: Strategy for hosting the application.
- **Details**: Containerized deployment for easy scaling and portability.

### R-401: Buy Me A Coffee Integration
- **Description**: Support for user donations.
- **Details**: Integration with donation platforms and a simple internal dashboard.

### R-402: Branding and Domain
- **Description**: Naming and domain acquisition.
- **Details**: Potential name: "Hermitic".

### R-403: CI/CD Pipelines
- **Description**: Automated testing and deployment.
- **Details**: GitHub Actions or similar for stable delivery.

### R-404: API Caching
- **Description**: Performance optimization for responses.
- **Details**: Use Redis for efficient data retrieval.

### R-405: Background Jobs / Task Queue
- **Description**: Offloading heavy tasks.
- **Details**: Celery + Redis for asynchronous processing.

### R-501: Content Track Creation Tool
- **Description**: Tooling for users to create and share their own programs.
- **Details**: Comprehensive interface for building multi-day spiritual tracks.

### R-502: Markdown & Media Support for Content
- **Description**: Allow rich text and images in user-generated content.
- **Details**: Support for Bible verse embedding and image uploads.

### R-503: Global Gallery & Publishing
- **Description**: Users can publish tracks to a global space.
- **Details**: Marketplace-style browsing (free initially) where users can discover, rate, and "enroll" in tracks created by others.

### R-504: Private vs Public Controls
- **Description**: Granular privacy settings for content.
- **Details**: Logic to restrict access to tracks. Private tracks remain invisible unless explicitly shared via a group link.

### R-505: Video & Reflection Integration
- **Description**: Specific support for video links and reflection question sets.
- **Details**: Reflection questions should allow for persisted answers (journaling) linked to a user's enrollment in the track.

### R-601: Stained Glass Mosaic Gamification
- **Description**: Completion of daily tasks contributes to building a digital stained glass mosaic of a saint.
- **Details**: Visual progress system where individual task completions unlock pieces of a larger artwork, providing a tangible sense of spiritual building.

### S-602: Collaborative Group Rewards
- **Description**: Mutual rewards for groups when all members complete their daily tasks.
- **Details**: Shared goal system that incentivizes group accountability through collective milestones and shared visual payoffs.

### S-603: Social Encouragement (Kudos)
- **Description**: "Strava-style" kudos or prefab encouragement messages for community support.
- **Details**: One-tap reactions or quick-select messages to recognize and validate peers' efforts.

### S-604: Promptness Incentives
- **Description**: Rewards for users who log all daily activities by a specific deadline.
- **Details**: Bonuses (e.g., special mosaic pieces or badges) for consistent and timely self-reporting.

### R-701: Personal Analytics Dashboard
- **Description**: Advanced data visualization to track progress and identify success patterns over time.
- **Details**: Interactive charts showing correlations between habits and spiritual consistency.

### R-702: AI-Powered Behavioral Insights
- **Description**: Use ML/AI to identify behavioral patterns and provide actionable insights.
- **Details**: Predictive modeling to surface correlations like "When I do X in the morning, I am more likely to complete Y," helping users optimize their spiritual routines.

---

## 📚 Resources

### A curated list of awesome Catholic projects, libraries and software.
- [Awesome Catholic](https://github.com/awesome-catholic/awesome-catholic)

### Free Use Bible API
- [Free Use Bible API](https://bible.helloao.org/docs/)

### Liturgical Calendar File
- [Liturgical Calendar File](https://github.com/igneus/church-calendar-api/blob/master/data/universal-en.txt)

### Daily Mass Readings API
- [Daily Mass Readings API](https://www.universalis.com/%7B%7D/jsonpmass.js)

### Code to call Mass Reading API
- Dates must be formatted as YYYYMMDD
- The response is JSONP, not pure JSON
- Production implementations typically perform additional cleanup to remove embedded HTML before use
``` typescript
type UniversalisResponse = {
  Mass_G: string; // Gospel (example field)
};

async function getMassReadings(date: string): Promise<UniversalisResponse> {
  const url = `https://www.universalis.com/${date}/jsonpmass.js`;

  // Fetch raw JSONP response
  const res = await fetch(url);
  const body = await res.text();

  // Strip JSONP wrapper: universalisCallback(...);
  const json = body
    .replace(/^universalisCallback\(/, "")
    .replace(/\);\s*$/, "");

  // Parse into a JS object
  return JSON.parse(json) as UniversalisResponse;
}

// Example usage
(async () => {
  const readings = await getMassReadings("20251225"); // YYYYMMDD
  console.log(readings.Mass_G);
})();
```
