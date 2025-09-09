# DriveNova Frontend

- This is the frontend of the *DriveNova* project — a premium car rental platform featuring animated UI, dark mode toggle, category filtering, search, and integrated authentication via Google/GitHub OAuth with JWT handoff from the backend. The client consumes REST APIs for cars, bookings, and contact, and manages session state via localStorage.
- It is designed to deliver speed, security, and interactivity while connecting with the backend services for authentication, car listings, and bookings.

## Live Site
👉 [DriveNova Frontend](https://drivenova.onrender.com)

## Features
- Clean and interactive user interface with animations
- Search and browse from a wide catalog of cars
- Auth with JWT: Google/GitHub login redirects back with token, stored in localStorage for API calls.
- Booking and contact flows wired to backend endpoints, with success/error toasts and graceful fallbacks.
- Dark mode support for better accessibility.

##Tech Stack
- HTML5, CSS3 (design tokens, responsive, dark mode), JS.
- REST API integration with a configurable API base URL via constant.

## Project Structure
- index.html — main page with sections (hero, search, fleet, features, contact).
- style.css — tokenized theme, dark mode, components, animations, responsive rules.
- app.js — API integration, auth handling, UI rendering, filters, and booking logic.

## Important Note
- This repository is part of a full-stack project. The backend code is hosted in a separate repository.  
- The project is made available here for demonstration purposes only. Unauthorized copying or redistribution of this work is not permitted.

## Related Repository
- [DriveNova Backend](https://drivenova-backend.onrender.com)

