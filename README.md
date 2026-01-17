# 🚀 Node.js Backend Boilerplate

A production-ready, feature-rich Node.js boilerplate with TypeScript, Express, and Mongoose. Designed to be modular, scalable, and easy to configure.

## ✨ Features

- **🔌 Plug-and-Play Modules**: Toggle features like Auth, Uploads, Logging via `features.json`.
- **🔐 Authentication**: Flexible Auth (JWT) with Google & GitHub support, RBAC, and optional route protection.
- **📁 File Uploads**: Integrated `Multer` support for Local and S3 uploads.
- **📧 Email Service**: Built-in `Nodemailer` service.
- **🛡️ Security**: Helmet, CORS, Rate Limiting, Data Sanitization.
- **📝 Logging**: Winston Logger with daily rotation and different log levels.
- **⚡ Developer Experience**: ESLint, Prettier, Husky, Nodemon, and **Scaffolding Tools**.
- **📚 Documentation**: Auto-generated Swagger API docs.
- **🧪 Testing**: Jest & Supertest setup.

## 🚀 Quick Start (One-Liner)

Run this command to create a new project called `my-app` (change `my-app` to your preferred name):

```bash
git clone https://github.com/4bhis1/node-express-boilerplate.git my-app && cd my-app && npm install && npm run setup
```

This will:

1. Clone the boilerplate.
2. Install dependencies.
3. specific **Project Name** & **Features**.
4. Auto-remove the setup script from `package.json`.

### Manual Setup

If you prefer manual steps:

1. `git clone <repo-url> my-project`
2. `cd my-project`
3. `npm install`
4. `npm run setup`

### 2. Start Development

```bash
npm run dev
```

Server will start at `http://localhost:8000`.

### 3. API Documentation

Visit `http://localhost:8000/api-docs` to view the Swagger API documentation.

## 🛠️ Scaffolding

Generate new modules (Controller, Service, Model, Routes) instantly:

```bash
npm run generate <module-name>
# Example: npm run generate product
```

This will create `src/modules/product/` with all necessary files. Don't forget to register the routes in `src/routes/index.ts`.

## ⚙️ Configuration

### Features (`features.json`)

Control your application modules without changing code:

```json
{
  "auth": { "enabled": true, "google": false },
  "upload": { "enabled": true, "provider": "local" },
  "logging": { "enabled": true, "level": "info" }
}
```

### Environment (`.env`)

```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/my-project
JWT_SECRET=super-secret
...
```

## 🧪 Testing

Run integration tests:

```bash
npm test
```

## 📂 Project Structure

```
src/
├── bin/          # CLI Scripts (Setup, Generate)
├── config/       # Configuration (Logger, Passport, Features)
├── controllers/  # Request Handlers
├── modules/      # Feature Modules (Todo, etc.)
├── middleware/   # Custom Middlewares (Auth, Error)
├── routes/       # Route Definitions
├── services/     # Business Logic
├── utils/        # Utilities (AppError, CatchAsync)
├── app.ts        # Express App Setup
└── index.ts      # Entry Point
```

## 📄 License

ISC
