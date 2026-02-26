# shift-sync
A full-stack automation tool designed to bridge the gap between legacy workforce management portals (ABI MasterMind) and modern productivity suites (Google Calendar). This application enables employees to synchronize their work schedules across multiple months with a single click.

## Features
- Multi-Month Synchronization: Automatically detects and navigates to subsequent months to capture newly released schedules.
- Real-Time Status Streaming: Utilizes Server-Sent Events (SSE) to provide live updates (e.g., "Logging in...", "Scraping March...") to the frontend.
- Optimized Performance: Leverages batch JavaScript injection to reduce data extraction time from 180s to ~15s.
- Secure OAuth 2.0 Flow: Implements delegated Google Calendar access, ensuring no user credentials or persistent tokens are stored server-side.
- Duplicate Prevention: Intelligent event checking prevents the creation of redundant calendar entries.

## Tech Stack
### Frontend
- Next.js 14: App Router and TypeScript for a robust, type-safe UI.
- Tailwind CSS: Responsive, utility-first styling.
- @react-oauth/google: Secure client-side authentication.

### Backend
- FastAPI: High-performance Python framework for handling concurrent sync requests.
- Selenium WebDriver: Headless Chromium automation for interacting with legacy DOM structures.
- Google Calendar API: Integration for programmatic event creation.

## Deployment & Configuration
### Prerequisites
- Google Cloud Console Project with Calendar API enabled.
- OAuth 2.0 Client ID with http://localhost:3000 whitelisted as a JavaScript Origin.

## Environment Variables
Frontend (.env.local):

Bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 # Use Railway URL for production
Backend (Railway Variables):

Bash
CHROME_BIN=/usr/bin/chromium-browser
CHROMEDRIVER_PATH=/usr/bin/chromedriver
## Installation
Clone the repository:

Bash
```
git clone https://github.com/your-username/abi-shift-sync.git
```
### Setup Backend:

Bash
```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
### Setup Frontend:

Bash
```
cd frontend
npm install
npm run dev
```
## License
This project is for internal workforce productivity and is intended for use in compliance with ABI MasterMind's Terms of Service.
