# Dynamic MongoDB Connector — Low-Code CPaaS POC

This is a proof-of-concept for a low-code/no-code CPaaS platform where a client can connect their own MongoDB database using a MongoDB connection URI. 
The platform dynamically discovers MongoDB collections and infers their document structure at runtime.

## Requirements
- Node.js (v16+)
- MongoDB locally or Atlas URI

## Installation

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Start backend

```bash
cd backend
npm run dev
```

## Start frontend

```bash
cd frontend
npm run dev
```

## Seed demo database

To create dummy data for testing the application:

```bash
cd backend
npm run seed
```

## Testing

1. Start your local MongoDB server (or have an Atlas URI ready).
2. Seed the database (see above).
3. Start backend (`npm run dev` in `backend` folder).
4. Start frontend (`npm run dev` in `frontend` folder).
5. Open the frontend URL in your browser.
6. Click `+ Connect` on the sidebar.
7. Enter MongoDB URI (e.g. `mongodb://localhost:27017`) and Database Name (`demo_database`).
8. Connect.
9. See automatically discovered collections in the sidebar (`customers`, `orders`, `products`, `messages`).
10. Open `customers`.
11. See automatically inferred fields at the top of the page.
12. Create a document using the dynamic form.
13. Edit a document.
14. Delete a document.
15. Connect another database and verify that no code changes are required.

## Future Architecture Roadmap
- Multi-tenancy
- Tenant Authentication
- Encrypted MongoDB Credentials (e.g., AWS Secrets Manager)
- Tenant Connection Pool
- Schema Metadata Cache (Redis)
- Workflow Engine (Low-Code Node Builder)
