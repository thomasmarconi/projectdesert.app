# App Requirements Traceability Matrix

## MVP Requirements Table
| Req ID | Feature Category | Requirement Description | Source | Status | Priority | Tech/Implementation Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Tracking | Daily tracking of asceticism activities. | User Req. | To Do | Highest | Requires structured DB (RDBMS) for logging. |
| 2 | Content | Integrate Daily Mass Readings & Reflection Prompt. | Suggested | To Do | Highest | Requires API for liturgical readings. Implement Caching of this |
| 3 | Frontend | Use Next.js/TypeScript/React. | User Req. | To Do | Highest | Frontend stack decision made. |
| 4 | Backend | Use Python FastAPI. | User Req. | To Do | Highest | Backend stack decision made. For auth and users: `fastapi-users` library |
| 5 | Data | Use a Structured (RDBMS) database (PostgreSQL/MySQL). | Architect | To Do | Highest | Ensures data integrity and complex querying for social features. |
| 6 | Deployment | Scalable, cost-effective deployment strategy (e.g., Cloud Run). | Architect | To Do | Highest | Docker containerization of FastAPI needed. |
| 7 | Deployment | Create CI/CD pipelines | Architect | To Do | Medium | Need this to ensure stable development and deployment |
| 8 | Backend | Caching for the API | Architect | To Do | Highest | Redis + aioredis |
| 9 | Foundation | User Authentication and authorization | User Req. | To Do | Highest | Need simple auth for users to log in and out using username and password and then also using OAuth with Google. Also the API needs to be protected with authentication (JWT tokens) |
| 10 | Foundation | User Authorization | User Req. | To Do | High | Need to implement role-based authorization for users. |
---

## Stretch Goals Table
| Req ID | Feature Category | Requirement Description | Source | Status | Priority | Tech/Implementation Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 11 | Content | Pull a daily quote from the Desert Fathers. | User Req. | To Do | Low | API/Content source needed. Caching recommended. |
| 12 | Content | Story about the saint of the day (Roman Missal calendar). | User Req. | To Do | Medium | Integrate with an authoritative calendar source API. |
| 13 | Content | Implement a Liturgy of the Hours section (text). | User Req. | To Do | Medium | Requires sourcing the LOTH text/API. |
| 14 | Tracking | Track progress against a primary vice/root sin. | Suggested | To Do | High | Link R-101 logs to a defined vice/virtue. |
| 15 | Tracking | Implement Streak Counts and Progress Charts. | Suggested | To Do | High | Frontend visualization component needed. |
| 16 | Tracking | Guided Daily Examination of Conscience (Examen). | Suggested | To Do | High | Structured input/journaling feature. |
| 17 | Content | For asceticism activities allow for categories | User Req. | To Do | Highest | Tied to R-1 |
| 18 | Collaboration | Enable user collaboration/interaction. | User Req. | To Do | Highest | |
| 19 | Collaboration | Users can form accountability groups. | User Req. | To Do | Highest | Requires RDBMS for group-user relationships. |
| 20 | Communication | Users can send messages to each other (in-app). | User Req. | To Do | High | Requires WebSockets (FastAPI backend). |
| 21 | Notification | Email notifications (for accountability/activity). | User Req. | To Do | High | Requires email service provider (e.g., SendGrid, AWS SES). Will run these inside of the celery tasks |
| 22 | Communication | Virtual Prayer Wall (post and commit to intentions). | Suggested | To Do | High | Requires a separate table for intentions linked to users/groups. |
| 23 | Collaboration | Mentor/Spiritual Director Role (read-only access to logs). | Suggested | To Do | Low | Requires detailed user permissions logic. |
| 24 | Collaboration | Accountability Group Challenges/Dashboards. | Suggested | To Do | Medium | Group-level aggregation queries on R-101 data. |
| 25 | Real-time | Implement WebSockets for real-time features. | User Req. | To Do | Highest | Requires dedicated WebSocket handling in FastAPI. Use Redis pub/sub for this |
| 26 | Donations | Implement Buy Me A Coffee to allow for user donations | User Req. | To Do | Low | Also have some sort of support dashboard that shows how much the app has been making via donations versus what we are paying per month for hosting |
| 27 | Marketing | Decide on an app name and buy a domain | User Req. | To Do | Low | A thought: "hermitic" \| hermitic.io and hermitic.app aren't that expensive. Going to have to rethink this with the new ideas for the app |
| 28 | Backend | Background jobs / Task Queue | Architect | To Do | High | Background Jobs / Task Queue: Celery + Redis |
| 29 | Content | Content track creation tool | User Req. | To Do | Medium | Was thinking that users could create their own programs and then invite users to them. |
| 30 | Content | Allow users to create word docs for their content using markdown. Add images, etc. | User Req. | To Do | Medium | |


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