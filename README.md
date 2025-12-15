# ScholasticAI - School Management System

A modern, AI-powered School Management System designed for CBSE Senior Secondary schools.

## 🚀 Deployment Guide

This application is built with **React** and **TypeScript**. It is designed to be hosted on static hosting platforms like **Vercel**, **Netlify**, or **GitHub Pages**.

### 1. Environment Variables (Critical)
For the AI features (Gemini Assistant) to work, you must configure the API Key in your hosting provider's dashboard.

*   **Variable Name:** `API_KEY`
*   **Value:** Your Google GenAI API Key

> **Note:** Do not commit your API key to GitHub. Set it in the "Environment Variables" section of your deployment platform.

### 2. Data Architecture (Demo Mode)
This application uses a **Client-Side Database** strategy perfect for product demonstrations:

*   **Deterministic Generation:** On first load, the app generates a "Factory Default" school with ~700 students and complete staffing using a fixed mathematical seed (`12345`). This ensures **every new user sees the exact same demo data**.
*   **Local Persistence:** Any changes a user makes are saved to their browser's `localStorage`. User A's changes do not affect User B.
*   **Factory Reset:** Users can go to **Settings > Factory Reset** to wipe their changes and restore the original Demo Data.

### 3. Build Command
```bash
npm run build
```
This will generate a `dist/` or `build/` folder that can be served statically.

## 🛠 Features
*   **Administration:** Dashboard, Class Structure, Curriculum Manager.
*   **Academics:** Daily Class Logs, Date Sheet Generator (Exam Scheduler).
*   **People:** Student Directory (360° Profiles), Staff Workload Management.
*   **AI Integration:**
    *   **Circular Generator:** Drafts professional notices.
    *   **Factor Analysis:** Correlates student attendance and activities with exam grades.
