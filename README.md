# Toaster

A full-stack application built with React and NestJS.


## Tech Stack

### Client
- **React 18** - UI library
- **Vite 6** - Build tool and dev server
- **TypeScript 5.7** - Type safety
- **React Router 7** - Client-side routing

### Server
- **NestJS 10** - Backend framework
- **TypeScript 5.7** - Type safety
- **Swagger** - API documentation

## Project Structure

```
toaster/
├── client/          # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
├── server/          # NestJS backend application
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   └── main.ts
│   └── test/             # E2E tests
└── package.json     # Root package.json with workspace scripts
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

Or install separately:
```bash
# Root dependencies
npm install

# Client dependencies
cd client && npm install

# Server dependencies
cd server && npm install
```

2. Set up environment variables:
```bash
# Server
cp server/.env.example server/.env
```

### Development

Run both client and server concurrently:
```bash
npm run dev
```

Or run separately:
```bash
# Client only (http://localhost:5173)
npm run dev:client

# Server only (http://localhost:3000)
npm run dev:server
```

### Building for Production

```bash
npm run build
```

### Running Production

```bash
npm start
```

## API Documentation

When the server is running, Swagger documentation is available at:
- http://localhost:3000/api/docs

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run install:all` | Install dependencies for all packages |
| `npm run dev` | Run both client and server in development mode |
| `npm run dev:client` | Run client only |
| `npm run dev:server` | Run server only |
| `npm run build` | Build both client and server |
| `npm run start` | Start production server |
| `npm run lint` | Lint both client and server |

## Ports

- **Client**: http://localhost:5173
- **Server**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
# toaster-ai
