# Remote Signature Kiosk System Plan

## Overview
This document outlines the architecture and implementation plan for a "Kiosk Style" remote signature system. This allows a dedicated phone or tablet (mounted in a 3D printed case) to act as a permanent signature pad for the Tow Ticket system, replacing expensive hardware like Topaz pads.

## Concept
- **The Pad (Phone/Tablet):** Stays on a single, permanent webpage (e.g., `blazinik.com/treadz/towing/sign-pad.html?station=1`). It is always "listening" for a request.
- **The Desktop (Ticket):** Can "push" a signature request to the specific Station ID when a customer is ready to sign.
- **The Bridge (Firebase):** Handles the instant communication between the two devices.

---

## Architecture

### 1. Database Structure (Firebase Realtime DB)
We will use a simple path to track the state of the pad.

```json
/stations
  /station_1
    - status: "idle" | "waiting_for_signature" | "signed"
    - current_ticket_id: "12345"
    - signature_data: "data:image/png;base64,..." (or URL)
    - timestamp: 1715000000
```

### 2. Workflow
1.  **Desktop Action:**
    *   Agent fills out the ticket (ID: `9999`).
    *   Agent clicks **"Send to Signature Pad"**.
    *   **Code:** Updates Firebase `/stations/station_1`:
        *   `status`: "waiting_for_signature"
        *   `current_ticket_id`: "9999"

2.  **Pad Reaction (The Phone):**
    *   The phone is permanent open to `sign-pad.html`.
    *   It detects the status change to `waiting_for_signature`.
    *   **UI:** It wakes up/clears the screen and displays: *"Please Sign Below for Ticket #9999"*.
    *   Canvas is active.

3.  **Customer Signing:**
    *   Customer signs with finger or stylus.
    *   Customer taps **"Done"**.
    *   **Code:**
        *   Uploads the signature image to Firebase Storage (or saves Base64 string to DB if small).
        *   Updates Firebase `/stations/station_1`:
            *   `status`: "signed"
            *   `signature_data`: [IMAGE_DATA]

4.  **Desktop Completion:**
    *   The Desktop ticket page detects `status` changed to "signed".
    *   **UI:** It automatically grabs the `signature_data` and displays it in the "Customer Signature" box on the agent's screen.
    *   **Code:** Resets `/stations/station_1` status to "idle" for the next customer.

---

## Implementation Steps

### Phase 1: Firebase Setup
*   Create a free Firebase Project.
*   Enable **Realtime Database** (Test Mode).
*   Enable **Storage** (if saving high-res images).
*   Get the **Config Keys** (API Key, Project ID, etc.).

### Phase 2: The "Pad" Page (`sign-pad.html`)
*   Create a clean, distraction-free HTML page.
*   **Features:**
    *   Full-screen Canvas.
    *   "Clear" and "Accept" buttons.
    *   Status Indicator (e.g., "Ready" vs "Waiting for Desktop").
*   **Logic:**
    *   Connect to Firebase.
    *   Listen to `/stations/station_1`.
    *   Show "Ready to Sign" when status is `waiting`.
    *   Show "Thank You" when complete.

### Phase 3: The Ticket Integration (`ticket/index.html`)
*   Add a **"Send to Pad"** button near the signature area.
*   Add logic to:
    *   Write the request to Firebase.
    *   Show a spinner: *"Waiting for Customer..."*
    *   Listen for the "signed" response.
    *   Auto-populate the signature field.

## Hardware Setup
*   **Device:** Any cheap Android phone or old iPhone/iPad.
*   **Mount:** 3D printed kiosk case with charging cable slot.
*   **Settings:**
    *   Set display sleep to "Never".
    *   Use "Kiosk Mode" or "Pinned App" mode in browser to prevent navigating away.
    *   Connect to Wi-Fi.

## Scalability
*   You can have multiple stations (`?station=1`, `?station=2`) if you have multiple desks.
*   The system is extremely fast (sub-second latency).
