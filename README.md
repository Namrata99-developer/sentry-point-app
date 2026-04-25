<div align="center">
  <img src="sentrypoint-web/public/logo512.png" alt="Sentry Point Logo" width="120" height="120" />
  <h1>Sentry Point</h1>
  <p><b>Anonymous Incident Reporting & Safety Mapping System</b></p>
  <p><i>Turning community fear into actionable community data.</i></p>

  <a href="https://sentry-point-app.vercel.app/">
    <img src="https://img.shields.io/badge/Demo-Live_on_Vercel-brightgreen?style=for-the-badge&logo=vercel" alt="Live Demo" />
  </a>
  <a href="https://www.loom.com/share/a001ff4aa78542e5a7316c78d2cef0b9">
    <img src="https://img.shields.io/badge/Video-Pitch_%26_Demo-red?style=for-the-badge&logo=youtube" alt="Pitch Video" />
  </a>
</div>

---

## 🚀 Overview
**Sentry Point** is a privacy-centric safety application designed for the **Elite Her** hackathon. It bridges the gap between perceived public safety and official crime statistics by allowing citizens to anonymously report incidents like harassment, poor lighting, or suspicious activity. 

By using geospatial data and privacy-preserving algorithms, we empower users to choose safer routes and provide urban planners with high-density data for infrastructure improvement.

---

## ✨ Key Features

### 🛡️ Privacy-First: $k$-Anonymity Logic
To protect user identity and prevent tracking, we implemented a **$k$-anonymity model ($k=3$)**. 
* A single report will **not** appear on the public map immediately.
* A marker only populates once **3 independent reports** are logged in the same vicinity.
* This ensures data integrity and prevents the system from being used to monitor individual movement.

### 📍 Dual-Mode Reporting
* **Real-Time GPS:** For immediate safety concerns, users can use a one-tap GPS feature to tag their current coordinates.
* **Manual Retrospective Reporting:** Users can wait until they are safely home to manually select a location on the map, ensuring they aren't distracted while in a high-risk area.

### ⏳ 365-Day Temporal Slider
* Safety isn't static. Our interactive slider allows users to filter reports by time, visualizing how safety "hotspots" change over the course of a year.

### 📊 Public Safety Dashboard
* An aggregated analytical view for community leaders to identify high-severity areas and plan data-driven interventions like improved street lighting or patrols.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS, Leaflet.js (Maps) |
| **Backend** | Python (FastAPI) |
| **Database** | Supabase (PostgreSQL) |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 📂 Project Structure

```text
├── SentryPoint_Backend/   # FastAPI Python Server & Privacy Logic
├── sentrypoint-web/       # React Frontend & Mapping Interface
│   ├── public/            # Icons & Branding Assets
│   └── src/               # UI Components & Map Logic
└── README.md              # Documentation
