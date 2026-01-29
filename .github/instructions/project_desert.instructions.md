---
applyTo: "**"
---

---

## applyTo: "\*\*"

# Copilot Agent Instructions

These instructions must be followed for all contributions to this repository.

## General Behavior

- Follow existing project structure and conventions exactly.
- Do not introduce new patterns, libraries, or frameworks without explicit instruction.
- Prefer clarity and correctness over cleverness or brevity.
- Do not remove or rename existing files unless explicitly asked.
- You can remove unused code when you find it.

## Code Quality

- Write clean, readable, and maintainable code.
- Avoid unnecessary abstraction.
- Match the style of surrounding code.
- Do not include commented-out code or TODOs unless explicitly requested.

## Changes & Safety

- Make the smallest change necessary to satisfy the request.
- If you can't figure it out you may try refactoring the code to meet the request.
- Do not change public APIs unless explicitly instructed.
- If a request is ambiguous, ask for clarification instead of guessing.

## Explanations

- When explaining changes, be concise and factual.
- Prefer bullet points over paragraphs.
- Explain _why_ a change was made only if it is non-obvious.

## Testing

- Do not add or modify tests unless explicitly requested.
- If changes affect behavior, mention what should be tested manually.

## Prohibited Behavior

- Do not hallucinate APIs, functions, or files.
- Do not assume requirements that are not stated.

## API Access Pattern

- Do NOT define API calls (fetch, axios, client calls) directly inside UI components.
- All API interaction logic must live in dedicated service files.
- Components may only call functions exposed by service modules.
- If no appropriate service file exists, create one following existing naming conventions.

## Prisma Schema Management

- Any database schema change must be made in the Prisma schema files.
- When modifying the database schema, update:
  - `backend/prisma/schema.prisma`
  - `frontend/prisma/schema.prisma`
- Do not modify only one schema file.
- Assume both schemas must remain structurally identical.
- Do not manually redefine database types in code that are derived from Prisma models.

## Backend API Validation

- Do NOT assume an API route exists.
- Before calling a backend API, check the backend codebase to confirm the route exists.
- If the route does not exist:
  - Create the API route in the backend.
  - Follow existing routing, validation, and error-handling patterns.
- Do not mock or fake API responses to bypass missing routes.

## TypeScript / JavaScript

- Use explicit typing where reasonable.
- Do not use `any`.
- Prefer named exports unless default exports already exist.

## Next.js

- Use the App Router conventions.
- Do not introduce client components unless required.
- Respect server/client boundaries.

## Database

- Do not modify schema or migrations unless explicitly instructed.
- Assume Prisma is the source of truth for types.

## Ambiguity Rule

- If a task has multiple valid implementations, pause and ask a clarifying question.
- Do not choose an approach arbitrarily.

Failure to follow these instructions is considered incorrect behavior.
