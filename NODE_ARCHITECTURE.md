# MNM_Bandat Node.js Plan

## Goal
Build the project as a clean Node.js app.

## Backend layout
- `backend/server.js`
- `backend/src/app.js`
- `backend/src/config/db.js`
- `backend/src/routes/`
- `backend/src/controllers/`
- `backend/src/services/`
- `backend/src/middleware/`
- `backend/migrations/`
- `backend/seeds/`

## Data model
- `users`
- `agents`
- `properties`
- `property_images`
- `amenities`
- `property_amenities`
- `leads`
- `appointments`
- `wishlist`
- `compare_items`

## Next coding order
1. lock schema
2. split backend files
3. implement auth
4. connect frontend to API
5. finish GIS and upload flow
