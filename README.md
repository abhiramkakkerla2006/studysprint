# StudySprint

StudySprint is a small, beginner-friendly assignment tracker. Students can keep coursework in one place, see upcoming due dates, mark work complete, and search or filter their list.

## What it demonstrates

- Responsive interface built with HTML, CSS, JavaScript, and React.
- REST API built with Node.js and Express.
- MongoDB CRUD operations through Mongoose.
- Form validation, status filters, search, and clear loading/error/empty states.
- One-project Vercel deployment: the React app is served as a static build and Express runs as a serverless API.

## Features

- Create an assignment with a title, course, due date, and priority.
- Read and search assignments; filter all work, to-do items, or completed work.
- Update assignment details, priority, and completion status.
- Delete assignments after a confirmation prompt.
- View total assignments, work due in the next seven days, and completed assignments.
- See overdue and near-term due date labels.
- Adapt the layout to desktop, tablet, and mobile screens.

## Technology

React 18 · Vite · HTML5 · CSS3 · JavaScript · Node.js · Express 4 · MongoDB Atlas · Mongoose · Vercel

## Run locally

### Requirements

- Node.js 18 or newer and npm.
- A MongoDB database. MongoDB Atlas has a free shared database tier; a local MongoDB server also works.

### 1. Install packages

From the project root:

```bash
npm install
```

### 2. Add the database connection

Copy `.env.example` to `.env` and replace the example `MONGODB_URI` with your MongoDB connection string. Keep the database password private; never commit `.env` to GitHub.

For MongoDB Atlas, create a cluster and database user, allow your development IP in Network Access, then copy the Node.js connection string. Replace the password placeholder and use `studysprint` as the database name. The connection string should resemble:

```text
mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/studysprint?retryWrites=true&w=majority
```

If your password has reserved URL characters, URL-encode them before placing it in the URI.

### 3. Start the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite serves the React app and forwards `/api` requests to the Express server on port 5000. The API health endpoint is [http://localhost:5000/api/health](http://localhost:5000/api/health).

To make a production frontend build locally:

```bash
npm run build
```

## REST API

All assignment data is persisted in MongoDB.

| Method | Route | Action |
| --- | --- | --- |
| `GET` | `/api/health` | Check API and database connection |
| `GET` | `/api/assignments` | List assignments, ordered by due date |
| `POST` | `/api/assignments` | Create an assignment |
| `PATCH` | `/api/assignments/:id` | Update assignment fields or completion state |
| `DELETE` | `/api/assignments/:id` | Delete an assignment |

Example create body:

```json
{
  "title": "Research paper draft",
  "course": "Environmental Science",
  "dueDate": "2026-11-20",
  "priority": "High"
}
```

`priority` accepts `Low`, `Medium`, or `High`. `completed` is a boolean and defaults to `false`. Assignment titles and courses are required and have maximum lengths of 120 and 60 characters.

## Deploy to Vercel

The project includes `vercel.json`. Deploy the project root as a Vercel project; the configuration builds `client/dist` and routes `/api/*` to the Express function.

1. Push this project to a GitHub repository (see the next section).
2. In Vercel, import that repository and leave the root directory at the project root.
3. Add `MONGODB_URI` in the Vercel project's Environment Variables for Production (and Preview if desired). Use the same private Atlas URI; do not add angle brackets or commit the value.
4. In MongoDB Atlas Network Access, allow the Vercel deployment to connect. For a simple assignment deployment, Atlas documents `0.0.0.0/0` as allowing connections from anywhere; use a strong database password and least-privilege database user.
5. Deploy. Vercel rebuilds on subsequent pushes to the connected branch.
6. Open `<your-vercel-domain>/api/health`. A successful deployment returns `{"status":"ok","database":"connected"}`. Then try creating an assignment in the app.

Vercel and MongoDB Atlas account setup, credentials, and project ownership must be supplied by the person deploying. No live repository or deployment has been created as part of this source package.

## Upload to GitHub

Create an empty repository on GitHub, then run these commands from this project directory, replacing the remote URL with your own:

```bash
git init
git add .
git commit -m "Build StudySprint assignment tracker"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

If Git asks you to authenticate, finish sign-in in the browser or use a GitHub-supported credential manager. Never put an access token or database URI into these commands or the repository.

## Project structure

```text
studysprint/
├── api/index.js                 # Vercel serverless entry point
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx              # React interface and API integration
│       ├── main.jsx
│       └── styles.css           # Responsive layout and component styles
├── server/
│   ├── app.js                   # Express routes and MongoDB connection
│   ├── index.js                 # Local development server
│   └── models/Assignment.js     # Mongoose schema
├── .env.example
├── vercel.json
└── package.json
```

## Notes

- `.env` and build output are excluded by `.gitignore`.
- The browser displays a helpful setup message if it cannot reach the API or MongoDB.
- This starter has no authentication. In a public deployment, anyone with the URL can read, add, edit, or delete the shared assignment list. Use sample data for the classroom demonstration; add user accounts and authorization before storing private or multi-user coursework data.
