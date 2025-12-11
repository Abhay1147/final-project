# Habit Tracker - Code Audit & Cleanup

## Summary
This document shows what was removed and what was kept for the MVP.

## Removed Models ❌
- `UserPurchase` - Not needed for MVP (store is empty)
- `CoinTransaction` - Unnecessary transaction logging

## Kept Models ✅
- `User` - User authentication & profile
- `Habit` - Habit management
- `HabitLog` - Track completed habits
- `Comment` - User comments on habits
- `Feedback` - Support/feedback form
- `StoreItem` - Future store items (currently empty)

## Removed Code
- All old template-based routes (login.html, register.html, etc.)
- URL redirects (url_for, redirect)
- Flask flash messages
- Old form handling
- D3.js charts (can be added later)
- OAuth scaffolding

## Final API Endpoints (Lean & Clean)
```
AUTH:
  POST   /api/auth/login
  POST   /api/auth/register
  POST   /api/auth/logout
  GET    /api/auth/current-user

HABITS:
  GET    /api/habits
  POST   /api/habits
  POST   /api/habits/<id>/complete

COMMENTS:
  GET    /api/comments/habit/<id>
  POST   /api/comments
  PUT    /api/comments/<id>
  DELETE /api/comments/<id>

PROFILE & SUPPORT:
  GET    /api/profile
  POST   /api/support
  GET    /api/store
```

## File Sizes (Before → After)
- app.py: ~400 lines → ~280 lines (30% reduction)
- models.py: ~150 lines → ~100 lines (33% reduction)
- Removed: 7 old template files
- Added: 3 MVC JavaScript files (Model, View, Controller)

## What's Left
- Minimal, focused backend (Flask REST API only)
- Clean database models (6 essential tables)
- JavaScript SPA frontend (MVC architecture)
- No unnecessary features or dependencies

## To Add Later (Future)
- Store items (items exist, just empty)
- D3.js charts for analytics
- OAuth authentication
- Email notifications
- Habit streaks & achievements
