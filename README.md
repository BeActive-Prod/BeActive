# BeActive 🎯

**Self-hosted web app to stay organized and get things done every day.**

BeActive is a deadline-oriented task management application designed to help you prioritize your work and track your progress. With its intuitive interface and real-time synchronization, BeActive keeps you focused on what matters most.

## Features ✨

- 📋 **Deadline-Oriented Tasks** - Organize tasks by deadline hour and minute
- 🔄 **Real-Time Sync** - Changes sync instantly across all connected devices via WebSocket
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔗 **Share Lists** - Generate shareable links to collaborate with others
- 🔄 **Daily Rollover** - Automatically reset completed tasks at your preferred time
- 🚀 **Self-Hosted** - Full control over your data

## Architecture

BeActive is built with:
- **Frontend**: Next.js (React) - Modern, fast web interface
- **Backend**: TypeScript/Express - RESTful API with WebSocket support
- **Database**: SQLite - Simple, self-contained data storage
- **Proxy**: Nginx - Single port exposure and request routing

Everything runs in a single Docker container on port 8080.

## Quick Start 🚀

### Prerequisites
- Docker and Docker Compose installed
- 5 minutes of your time

### Installation

1. **Create a `docker-compose.yml` file:**

```yml
services:
  beactive:
    container_name: beactive
    image: ghcr.io/beactive-prod/beactive:latest
    ports:
      - '8080:8080' # You can change the first port to the one of your liking.
    restart: unless-stopped
    environment:
      NODE_ENV: production
```

2. **Start BeActive:**

docker-compose up -d

3. **Access the app:**

Open your browser and navigate to:
- **Default**: `http://localhost:8080`
- **Custom port**: `http://localhost:YOUR_PORT`

### Stopping BeActive

docker-compose down

---

## Usage Guide 📖

### Creating a Task
1. Enter your task title
2. Set the deadline hour and minute
3. Click "Add Task"

### Checking Off Tasks
- Click on a task to mark it as complete
- Task completion is saved automatically

### Sharing Your List
1. Click the "Share" button
2. Copy the generated link
3. Send it to others to collaborate in real-time

### Setting Up Daily Rollover
- Configure your preferred rollover time (when tasks reset)
- Completed tasks will automatically uncheck at this time

---

## Configuration 🔧

### Environment Variables

Current deployment uses default settings. Custom environment configuration coming soon.

### Persistent Storage

**Volume support is coming soon.** Currently, data is stored within the container. When you upgrade or recreate the docker, your data will not remain, so consider this a development/testing deployment.

---

## Development 💻

### Local Development Setup

Backend and Frontend on separate ports:

npm install
npm run dev:frontend
npm run dev:backend

### Production Docker Build

docker build -t beactive:latest .
docker run -p 8080:8080 beactive:latest

---

## Architecture Overview 🏗️

┌─────────────────────────────────────────────┐
│         Docker Container (Port 8080)        │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Nginx (Reverse Proxy)               │  │
│  │  - Routes requests to frontend/api   │  │
│  │  - Handles WebSocket connections    │  │
│  └──────────────────────────────────────┘  │
│           ↓              ↓                  │
│  ┌─────────────────┐  ┌──────────────────┐ │
│  │ Next.js (3000)  │  │ Express (3001)   │ │
│  │   Frontend      │  │    Backend       │ │
│  └─────────────────┘  └──────────────────┘ │
│           ↓              ↓                  │
│  ┌──────────────────────────────────────┐  │
│  │   SQLite Database                    │  │
│  │   - Tasks, Lists, User Data          │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘

---

## Roadmap 🗺️

- [x] Real-time task synchronization
- [x] Shareable lists
- [x] Daily task rollover
- [ ] **Persistent volumes** (coming soon)
- [ ] Custom themes
- [ ] Task categories
- [ ] Recurring tasks
- [ ] Mobile app

---

## Support & Contributing 💬

- **Found a bug?** Report it in the issues section
- **Have a feature idea?** Let us know!
- **Want to contribute?** Pull requests are welcome!

---

## License 📄

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License - see the LICENSE file for details.

---

## FAQ ❓

**Q: Will my data persist if I restart the container?**
A: Data persists while the container is not deleted or recreated. Persistent storage is coming soon.

**Q: Can I run this on a VPS/cloud server?**
A: Yes! Just make sure you expose the port and have Docker installed.

**Q: Can multiple people use the same instance?**
A: Yes! Share task lists using the sharing feature.

---

## Performance 🚀

- Lightweight Docker image (~300MB)
- Real-time WebSocket updates
- SQLite database for quick queries
- Single container deployment

---

Made with ❤️ to help you stay organized and productive.