# Metro Police Department Portal

A modern, secure web application for police department operations, featuring a public-facing informational site and an internal officer portal for evidence management and case tracking.

## Features

### Public Site
- **Responsive Design**: Clean, authoritative government aesthetic.
- **Service Information**: Easy access to records, crime mapping, and recruitment.
- **Emergency Info**: Clear categorization of emergency vs non-emergency contacts.

### Officer Portal (Secure)
- **Dashboard**: Real-time overview of active cases and department KPIs.
- **Evidence Locker**: Detailed gallery view of seized evidence with search functionality.
- **Incident Reporting**: Form-based interface for drafting and auto-saving case reports.
- **Duty Roster**: Live view of active units, officer status, and sector assignments.
- **BOLO Board**: "Be On The Lookout" hot-sheet for high-priority warrants and missing persons.
- **Case Management**: Mock interface for tracking officer casework.
- **Security**: Simulation of secure access zones.

## Technology Stack
- **Framework**: React (Vite)
- **Styling**: Vanilla CSS (Custom Design System) w/ CSS Variables
- **Icons**: SVG / Lucide-style (Embedded)
- **Fonts**: Inter (Google Fonts)

## Getting Started

1. Navigate to the directory:
   ```bash
   cd police-portal
   ```

2. Install dependencies (if not done):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open the link provided in the terminal (usually http://localhost:5173).

## Data
Evidence data is currently mocked in `src/data/mockEvidence.js`. You can edit this file to add or modify evidence items.
