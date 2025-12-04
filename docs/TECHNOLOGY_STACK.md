# 🚀 Technology Stack - AI Mock Interview Platform

## 📋 Complete Technology Overview

This document provides a comprehensive list of all technologies, tools, libraries, and frameworks used in the AI Mock Interview Platform.

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────┐
│         FRONTEND (React SPA)                │
│    Port: 3000 | Technology: React 18        │
└─────────────────┬───────────────────────────┘
                  │
                  │ HTTP/REST API
                  │
┌─────────────────▼───────────────────────────┐
│         BACKEND (Node.js/Express)           │
│    Port: 5001 | Technology: Express.js      │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────┐
│    MongoDB     │  │  Google Gemini  │
│   Database     │  │    AI API       │
└────────────────┘  └─────────────────┘
```

---

## 🔧 Core Technologies

### **Runtime & Language**
- **Node.js** v16+ - JavaScript runtime environment
- **JavaScript (ES6+)** - Programming language
- **JSX** - JavaScript XML for React components

### **Package Managers**
- **npm** - Node Package Manager for dependency management

---

## 💻 Frontend Technologies

### **Core Framework**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.2.0 | Main UI framework |
| **React DOM** | 18.2.0 | React rendering for web |
| **React Scripts** | 5.0.1 | Create React App build tools |

### **Routing & Navigation**
| Library | Version | Purpose |
|---------|---------|---------|
| **react-router-dom** | 6.3.0 | Client-side routing and navigation |

### **State Management**
| Library | Version | Purpose |
|---------|---------|---------|
| **Zustand** | 4.3.8 | Lightweight state management |
| **React Context API** | Built-in | Global state sharing |
| **React Query** | 3.39.3 | Server state management & caching |
| **Immer** | 10.0.2 | Immutable state updates |

### **HTTP & API**
| Library | Version | Purpose |
|---------|---------|---------|
| **Axios** | 1.4.0 | HTTP client for API requests |

### **UI & Styling**
| Library | Version | Purpose |
|---------|---------|---------|
| **Tailwind CSS** | 3.3.2 | Utility-first CSS framework |
| **PostCSS** | 8.4.24 | CSS processing |
| **Autoprefixer** | 10.4.14 | CSS vendor prefixes |
| **Framer Motion** | 10.12.16 | Animation library |
| **React Spring** | 9.7.3 | Spring physics animations |
| **clsx** | 1.2.1 | Conditional className utility |
| **tailwind-merge** | 1.13.2 | Merge Tailwind classes |

### **UI Components & Libraries**
| Library | Version | Purpose |
|---------|---------|---------|
| **Lucide React** | 0.263.1 | Icon library (modern Feather Icons) |
| **react-beautiful-dnd** | 13.1.1 | Drag and drop functionality |
| **react-color** | 2.19.3 | Color picker components |
| **react-datepicker** | 4.16.0 | Date picker component |
| **react-dropzone** | 14.2.3 | File drag & drop upload |
| **react-select** | 5.7.3 | Advanced select component |
| **react-tabs** | 6.0.2 | Tab component |
| **react-toggle** | 4.1.2 | Toggle switch component |
| **react-tooltip** | 5.18.1 | Tooltip component |
| **react-hot-toast** | 2.4.0 | Toast notifications |

### **Forms & Validation**
| Library | Version | Purpose |
|---------|---------|---------|
| **react-hook-form** | 7.43.9 | Form state management & validation |

### **Data Visualization**
| Library | Version | Purpose |
|---------|---------|---------|
| **Chart.js** | 4.3.0 | Chart rendering library |
| **react-chartjs-2** | 5.2.0 | React wrapper for Chart.js |

### **Content Rendering**
| Library | Version | Purpose |
|---------|---------|---------|
| **react-markdown** | 8.0.7 | Markdown rendering |
| **react-syntax-highlighter** | 15.5.0 | Code syntax highlighting |

### **PDF Generation**
| Library | Version | Purpose |
|---------|---------|---------|
| **jsPDF** | 2.5.2 | Client-side PDF generation |
| **html2canvas** | 1.4.1 | HTML to canvas conversion |

### **Utilities**
| Library | Version | Purpose |
|---------|---------|---------|
| **date-fns** | 2.30.0 | Date manipulation and formatting |
| **lodash** | 4.17.21 | JavaScript utility functions |
| **uuid** | 9.0.0 | UUID generation |
| **react-use** | 17.3.2 | Collection of React hooks |
| **react-intersection-observer** | 9.5.2 | Intersection Observer API wrapper |
| **react-virtualized** | 9.22.5 | Efficient large list rendering |

### **SEO & Meta**
| Library | Version | Purpose |
|---------|---------|---------|
| **react-helmet-async** | 1.3.0 | Document head management |

### **Testing**
| Library | Version | Purpose |
|---------|---------|---------|
| **@testing-library/react** | 13.3.0 | React component testing |
| **@testing-library/jest-dom** | 5.16.4 | Jest DOM matchers |
| **@testing-library/user-event** | 13.5.0 | User interaction simulation |

### **TypeScript Support (Dev Dependencies)**
| Library | Version | Purpose |
|---------|---------|---------|
| **@types/react** | 18.2.15 | React TypeScript definitions |
| **@types/react-dom** | 18.2.7 | React DOM TypeScript definitions |
| **@types/lodash** | 4.14.195 | Lodash TypeScript definitions |
| **@types/uuid** | 9.0.2 | UUID TypeScript definitions |

---

## 🔙 Backend Technologies

### **Core Framework**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Express.js** | 4.18.2 | Web application framework |
| **Node.js** | v16+ | JavaScript runtime |

### **Database**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **MongoDB** | - | NoSQL database |
| **Mongoose** | 7.5.0 | MongoDB ODM (Object Data Modeling) |
| **SQLite3** | 5.1.7 | Local database (for development/caching) |
| **better-sqlite3** | 12.2.0 | Faster SQLite3 implementation |

### **Authentication & Security**
| Library | Version | Purpose |
|---------|---------|---------|
| **jsonwebtoken** | 9.0.2 | JWT token generation & verification |
| **bcryptjs** | 2.4.3 | Password hashing |
| **helmet** | 7.0.0 | Security headers middleware |
| **cors** | 2.8.5 | Cross-Origin Resource Sharing |
| **express-rate-limit** | 6.10.0 | Rate limiting middleware |

### **Validation**
| Library | Version | Purpose |
|---------|---------|---------|
| **express-validator** | 7.0.1 | Request validation middleware |

### **AI & Machine Learning**
| Library | Version | Purpose |
|---------|---------|---------|
| **@google/generative-ai** | 0.1.3 | Google Gemini AI API client |

### **File Processing**
| Library | Version | Purpose |
|---------|---------|---------|
| **multer** | 1.4.5-lts.1 | File upload middleware |
| **pdf-parse** | 1.1.1 | PDF text extraction |
| **mammoth** | 1.6.0 | DOCX file parsing |
| **pdfkit** | 0.13.0 | PDF generation |

### **Utilities**
| Library | Version | Purpose |
|---------|---------|---------|
| **dotenv** | 16.3.1 | Environment variable management |
| **compression** | 1.7.4 | Response compression middleware |
| **morgan** | 1.10.0 | HTTP request logger |

### **Development Tools**
| Library | Version | Purpose |
|---------|---------|---------|
| **nodemon** | 3.0.1 | Auto-restart on file changes |
| **jest** | 29.6.2 | Testing framework |

---

## 🛠️ Development Tools & Build Tools

### **Build Tools**
- **Webpack** (via React Scripts) - Module bundler
- **Babel** (via React Scripts) - JavaScript transpiler
- **ESLint** (via React Scripts) - JavaScript linter

### **Development Servers**
- **webpack-dev-server** - Frontend development server
- **Node.js HTTP Server** - Backend development server
- **Hot Module Replacement (HMR)** - Live code updates

### **Version Control**
- **Git** - Version control system

---

## 🔌 External APIs & Services

### **AI Services**
| Service | Purpose |
|---------|---------|
| **Google Gemini AI** | Interview question generation, answer evaluation, resume analysis |

### **Database Services**
| Service | Purpose |
|---------|---------|
| **MongoDB** | Primary database for user data, interviews, resumes |
| **MongoDB Atlas** (optional) | Cloud-hosted MongoDB |

---

## 📦 Key Features & Their Technologies

### **1. Resume Builder**
**Technologies Used:**
- React (UI framework)
- react-beautiful-dnd (Drag & drop)
- jsPDF (PDF generation)
- html2canvas (HTML to image)
- Tailwind CSS (Styling)

### **2. AI Mock Interviews**
**Technologies Used:**
- Google Gemini AI (Question generation & evaluation)
- MediaRecorder API (Video/Audio recording)
- MongoDB (Interview storage)
- Express.js (API endpoints)
- React Context (State management)

### **3. Resume Analysis**
**Technologies Used:**
- pdf-parse (PDF extraction)
- mammoth (DOCX parsing)
- Google Gemini AI (Analysis)
- Multer (File upload)
- Mongoose (Data storage)

### **4. Analytics Dashboard**
**Technologies Used:**
- Chart.js (Charts)
- react-chartjs-2 (React wrapper)
- Zustand (State management)
- date-fns (Date handling)

### **5. Authentication System**
**Technologies Used:**
- JWT (Token-based auth)
- bcryptjs (Password hashing)
- Express middleware (Auth guards)
- React Context (Auth state)

### **6. File Management**
**Technologies Used:**
- Multer (File uploads)
- Node.js fs module (File system)
- PDFKit (PDF generation)
- Blob API (File downloads)

---

## 🎨 Design System

### **CSS Framework**
- **Tailwind CSS 3.3.2** - Utility-first CSS

### **Icons**
- **Lucide React** - Modern icon library

### **Animations**
- **Framer Motion** - Declarative animations
- **React Spring** - Spring physics animations

### **Color Palette**
- Custom Tailwind configuration
- Primary: Blue shades
- Secondary: Purple shades
- Success: Green shades
- Warning: Yellow shades
- Error: Red shades

---

## 🔐 Security Technologies

| Technology | Purpose |
|-----------|---------|
| **Helmet** | Security headers |
| **CORS** | Cross-origin protection |
| **bcryptjs** | Password encryption |
| **JWT** | Secure token authentication |
| **express-validator** | Input validation & sanitization |
| **express-rate-limit** | DoS protection |
| **HTTPS** (production) | Encrypted communication |

---

## 📊 Data Flow Technologies

### **Frontend → Backend**
```
React Components
     ↓
Axios HTTP Client
     ↓
Express.js Routes
     ↓
Mongoose Models
     ↓
MongoDB Database
```

### **AI Integration Flow**
```
User Input
     ↓
Express.js API
     ↓
Google Gemini AI SDK
     ↓
AI Response Processing
     ↓
MongoDB Storage
     ↓
React UI Update
```

---

## 🚀 Deployment Technologies

### **Frontend Deployment**
- **Vercel** / **Netlify** (recommended)
- **Static hosting** (build output)

### **Backend Deployment**
- **Heroku** / **Railway** / **Render**
- **Docker** (containerization)
- **PM2** (process management)

### **Database Hosting**
- **MongoDB Atlas** (cloud MongoDB)
- **MongoDB local instance**

---

## 📁 Project Structure Technologies

### **Module System**
- **ES6 Modules** (import/export)
- **CommonJS** (require/module.exports in backend)

### **Code Organization**
- **Component-based architecture** (React)
- **MVC pattern** (Backend)
- **Service layer pattern**
- **Custom hooks**
- **Context providers**

---

## 🧪 Testing Stack

### **Frontend Testing**
- **Jest** - Test runner
- **React Testing Library** - Component testing
- **@testing-library/user-event** - User interactions

### **Backend Testing**
- **Jest** - Test framework
- **Supertest** (potential) - HTTP assertions

---

## 📝 Development Workflow

### **Code Quality**
- **ESLint** - Code linting
- **Prettier** (potential) - Code formatting
- **Git hooks** (potential) - Pre-commit checks

### **Environment Management**
- **dotenv** - Environment variables
- **Different configs for dev/prod**

---

## 🔢 Version Summary

### **Major Dependencies**

**Frontend:**
- React: 18.2.0
- React Router: 6.3.0
- Tailwind CSS: 3.3.2
- Axios: 1.4.0
- jsPDF: 2.5.2
- Lucide React: 0.263.1

**Backend:**
- Express: 4.18.2
- Mongoose: 7.5.0
- Google Gemini AI: 0.1.3
- JWT: 9.0.2
- PDFKit: 0.13.0
- Multer: 1.4.5-lts.1

---

## 📊 Total Package Count

- **Frontend Dependencies**: 39
- **Frontend Dev Dependencies**: 6
- **Backend Dependencies**: 18
- **Backend Dev Dependencies**: 2
- **Total Packages**: 65

---

## 🎯 Technology Highlights

### **Why These Technologies?**

✅ **React 18** - Modern, performant, large ecosystem  
✅ **Tailwind CSS** - Rapid UI development, consistent design  
✅ **Express.js** - Minimal, flexible, widely adopted  
✅ **MongoDB** - Flexible schema, scales well  
✅ **Google Gemini AI** - Advanced AI capabilities  
✅ **JWT** - Stateless authentication  
✅ **Zustand** - Simple, lightweight state management  

---

## 🔄 Update Status

**Last Updated**: October 17, 2025  
**Project Version**: 1.0.0  
**Node.js Version**: v16+  
**npm Version**: v8+  

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Express.js Documentation](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Google Gemini AI Documentation](https://ai.google.dev)

---

**This is a modern, full-stack JavaScript application using the MERN stack (MongoDB, Express, React, Node.js) enhanced with AI capabilities!** 🚀
