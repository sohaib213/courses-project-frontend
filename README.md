# Courses Platform – Frontend

A full-stack online learning platform that connects students and teachers. Students can explore courses, enroll, learn, take quizzes, track their progress, and interact with the platform. Teachers can manage their courses and learning materials, while administrators oversee platform operations.

This repository contains the **frontend application**, built with React and Vite.

## 🌐 Live Demo

[Open the Live Application](https://courses-project-frontend-five.vercel.app/)

## 🔗 Related Repository

- [Backend Repository](https://github.com/sohaib213/courses-project-backend)

## ✨ Features

### Authentication & User Management
- User authentication and protected routes.
- Role-based interfaces for students, teachers, and administrators.
- Integration with the backend authentication system.

### Student Features
- Browse and access available courses.
- Enroll in courses and access learning materials.
- Take quizzes and view results.
- Track learning progress.
- Interact with course-related features.

### Teacher Features
- Manage courses and educational content.
- Create and manage quizzes.
- Monitor student progress and performance.

### Interactive Learning
- Real-time communication using Socket.IO.
- Interactive code editor powered by Monaco Editor.
- Drag-and-drop interactions.
- Responsive and interactive user interface.

### Additional Features
- API integration using Axios.
- Global state management with Redux Toolkit.
- Form handling and validation.
- Toast notifications and user feedback.
- Payment integration through the backend.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | Building the user interface |
| Vite | Development server and build tool |
| React Router | Client-side routing |
| Redux Toolkit | Global state management |
| Axios | HTTP requests and API integration |
| Tailwind CSS | Styling and responsive design |
| Socket.IO Client | Real-time communication |
| Monaco Editor | Interactive code editor |
| React Hook Form | Form management |
| dnd-kit | Drag-and-drop interactions |
| Lucide React | Icons |

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/sohaib213/courses-project-frontend.git
```

### 2. Navigate to the Project Directory

```bash
cd courses-project-frontend
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure the Backend Connection

Make sure the backend is running and configure the frontend's API base URL to point to your backend server.

Backend repository:

[ courses-project-backend ](https://github.com/sohaib213/courses-project-backend)

If the project uses environment variables for the API URL, configure the appropriate `.env` file according to the variable name used in the source code.

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Builds the application for production |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint to check code quality |

## 🏗️ Production Build

To generate an optimized production build:

```bash
npm run build
```

The generated files will be placed in the `dist` directory.

## 🌍 Deployment

The frontend is deployed using [Vercel](https://vercel.com/).

Live application:

https://courses-project-frontend-five.vercel.app/

## 🔌 Backend Integration

This frontend communicates with a separate NestJS backend that handles:

- Authentication and authorization.
- Course and user management.
- Database operations.
- Quizzes, grading, and learning progress.
- Payments and payment processing.
- Real-time communication.
- File and media management.

Check out the backend source code:

[View Backend on GitHub](https://github.com/sohaib213/courses-project-backend)

## 👨‍💻 Author

**Sohaib Hassan**

- GitHub: [@sohaib213](https://github.com/sohaib213)

---

Built as part of a full-stack online learning platform project.
