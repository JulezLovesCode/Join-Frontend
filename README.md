# Join Frontend - Kanban Project Management Tool

The frontend application for the Join project management platform, providing a modern interface for organizing work efficiently.

## Overview

This is the client-side application for Join, which provides:

- Visual task organization with drag-and-drop Kanban board
- Contact management system for team collaboration
- Task categorization with priority levels and deadlines
- Productivity dashboard with key performance metrics
- User authentication with both regular and guest access

## Directory Structure

```
join_client/
├── pages/            # HTML templates
├── scripts/          # JavaScript modules
├── styles/           # CSS stylesheets
└── assets/           # Images and fonts
    ├── images/       # Icons and graphics
    └── fonts/        # Typography resources
```

## Features

- **Task Management:** Create, assign, prioritize and track tasks
- **Kanban Board:** Visual workflow with customizable columns
- **Contact System:** Organize team members and assign them to tasks
- **Summary Dashboard:** Quick overview of productivity metrics
- **Responsive Design:** Works on desktop and mobile devices
- **User Authentication:** Secure login/registration with guest option

## Technical Details

- Vanilla JavaScript with modular architecture
- API integration with standardized request handling
- Consistent error management with user feedback
- Responsive design with mobile and desktop layouts
- Offline capability with local data persistence

## Setup Instructions

### Running the Frontend

1. You can simply open `pages/index.html` in your browser
2. Alternatively, use a local development server:
   - With Python: `python -m http.server`
   - With Node.js: `npx serve`

### API Configuration

- The application expects a backend server running at `http://127.0.0.1:8000/`
- To change the API URL, edit `scripts/api_config.js`

## Usage Notes

- The frontend application can work in offline mode with limited functionality
- The default login credentials for testing are provided in the main README
- All API requests and responses are logged to the browser console for debugging
