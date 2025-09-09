DriveNova Frontend

A responsive, modern frontend for the DriveNova premium car rental platform featuring animated UI, dark mode toggle, category filtering, search, and integrated authentication via Google/GitHub OAuth with JWT handoff from the backend. The client consumes REST APIs for cars, bookings, and contact, and manages session state via localStorage.

Features

Landing hero, search, fleet grid, and animated interactions with a design token system and dark mode support.

Car filtering by category, name, price, and metadata visualization (fuel, transmission, seats).

Auth with JWT: Google/GitHub login redirects back with token, stored in localStorage for API calls.

Booking and contact flows wired to backend endpoints, with success/error toasts and graceful fallbacks.

Tech Stack

HTML5, CSS3 (design tokens, responsive, dark mode), Vanilla JS.

REST API integration with a configurable API base URL via constant.

Project Structure

index.html — main page with sections (hero, search, fleet, features, contact).

style.css — tokenized theme, dark mode, components, animations, responsive rules.

app.js — API integration, auth handling, UI rendering, filters, and booking logic.

Configuration

API base URL is defined in app.js: const API_BASE_URL = "https://drivenova-backend.onrender.com" (update if needed).

OAuth flow: after successful auth, backend redirects to FRONTEND_URL with token query; app.js saves it to localStorage as jwt_token.

Authentication

JWT is stored in localStorage under key jwt_token.

Auth header helper adds Authorization: Bearer <token> for protected endpoints.

Logout clears jwt_token and re-renders auth UI.

Environment

For local dev, ensure CORS allows the dev origin and FRONTEND_URL matches the running host.

Backend CORS whitelist includes http://127.0.0.1:5500 and http://localhost:5500 for file-server/Live Server workflows.

Running Locally

Serve index.html with a simple static server (e.g., VS Code Live Server).

Ensure backend runs locally or on a remote URL and update API_BASE_URL accordingly in app.js.

Deployment

Recommended: Netlify for frontend, Render for backend, MongoDB Atlas for DB, Cloudinary for images.

Set FRONTEND_URL in the backend to the deployed site so OAuth redirects back correctly with token.

Security Notes

JWT is stored in localStorage to enable cross-origin OAuth redirects; consider rotating tokens and using short expiry if elevating security requirements.

Ensure HTTPS in production and correct sameSite=None and secure cookie settings for session usage during OAuth on the backend (sessions are used by passport).

API Endpoints Used

GET /api/cars?category=&maxPrice=&minPrice=&name= — list cars with filters.

GET /api/cars/:id — fetch single car.

POST /api/bookings — create booking (requires Bearer token).

POST /api/contact — submit contact message.

License

UNLICENSED.
