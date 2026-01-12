# Bill-Wise

A modern invoice management system that helps businesses create, track, and manage invoices with ease. Built with React and Express, Bill-Wise streamlines the invoicing workflow with features like AI-powered invoice generation, business profile management, and real-time invoice tracking.

## Project Overview

Bill-Wise solves the hassle of manual invoice creation and management for freelancers and small businesses. Instead of juggling spreadsheets or expensive accounting software, you get a clean, intuitive interface to:

- Generate professional invoices in minutes
- Track payment status (draft, unpaid, paid, overdue)
- Store business and client information
- Use AI to auto-fill invoice details from images or text
- Manage multiple invoices with a centralized dashboard

The app uses Clerk for authentication, MongoDB for data persistence, and integrates Google's Gemini AI for smart invoice processing.

## Key Features

- **AI-Powered Invoice Creation** – Upload an image or paste text, and let AI extract invoice details automatically
- **Business Profile Management** – Save your business info (name, GST, address, logo) and reuse it across invoices
- **Invoice Status Tracking** – Mark invoices as draft, unpaid, paid, or overdue
- **PDF Preview & Export** – View invoices in a clean, printable format
- **Secure Authentication** – User accounts managed via Clerk
- **Responsive Design** – Works seamlessly on desktop and mobile
- **File Uploads** – Attach logos, stamps, and signatures to invoices
- **Dashboard Analytics** – Get a quick overview of your invoicing activity

## Tech Stack

### Frontend
- **React 19** – UI library
- **Vite** – Fast build tool and dev server
- **React Router** – Client-side routing
- **TailwindCSS 4** – Utility-first styling
- **Clerk React** – Authentication and user management

### Backend
- **Node.js & Express 5** – Server framework
- **MongoDB & Mongoose** – Database and ODM
- **Clerk Express** – Backend authentication middleware
- **Google Gemini AI** – AI-powered invoice parsing
- **Multer** – File upload handling
- **JWT & bcrypt** – Token management and password hashing

### Tools & Libraries
- **dotenv** – Environment variable management
- **CORS** – Cross-origin resource sharing
- **Validator** – Input validation
- **Nodemon** – Auto-restart during development

## Folder Structure

```
Bill-Wise/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection setup
│   ├── controllers/              # Business logic for routes
│   ├── models/
│   │   ├── invoiceModel.js       # Invoice schema (items, client, status, etc.)
│   │   └── businessProfileModel.js # Business profile schema
│   ├── routes/
│   │   ├── inoviceRouter.js      # Invoice CRUD endpoints
│   │   ├── businessProfileRouter.js # Business profile endpoints
│   │   └── aiInvoiceRouter.js    # AI invoice parsing endpoint
│   ├── uploads/                  # Uploaded files (logos, stamps, signatures)
│   ├── .env                      # Environment variables (not in repo)
│   ├── package.json
│   └── server.js                 # Express app entry point
│
├── frontend/
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── assets/               # Images, icons
│   │   ├── components/
│   │   │   ├── AppShell.jsx      # Main app layout with sidebar
│   │   │   ├── InvoicePreview.jsx # Invoice PDF-style preview
│   │   │   ├── AiInvoiceModal.jsx # AI invoice upload modal
│   │   │   ├── KpiCard.jsx       # Dashboard stats card
│   │   │   ├── Navbar.jsx        # Landing page navbar
│   │   │   ├── Hero.jsx          # Landing page hero section
│   │   │   ├── Features.jsx      # Landing page features
│   │   │   ├── Pricing.jsx       # Landing page pricing
│   │   │   ├── Footer.jsx        # Landing page footer
│   │   │   ├── StatusBadge.jsx   # Invoice status indicator
│   │   │   └── GeminiIcon.jsx    # Gemini AI icon component
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Landing page
│   │   │   ├── Dashboard.jsx     # Main dashboard with KPIs
│   │   │   ├── CreateInvoice.jsx # Invoice creation/editing form
│   │   │   ├── Invoices.jsx      # Invoice list view
│   │   │   └── BussinessProfile.jsx # Business profile form
│   │   ├── App.jsx               # Main app component with routes
│   │   ├── main.jsx              # React entry point
│   │   └── index.css             # Global styles and Tailwind config
│   ├── .env                      # Frontend environment variables
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (local instance or MongoDB Atlas account)
- **Clerk Account** (for authentication) – [clerk.com](https://clerk.com)
- **Google Gemini API Key** (for AI features) – [ai.google.dev](https://ai.google.dev)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JatinSarwa10/Bill-Wise.git
   cd Bill-Wise
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration / Environment Variables

#### Backend `.env` (in `backend/` folder)

Create a `.env` file with the following:

```env
# Server
PORT=4000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=your_mongodb_connection_string

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

#### Frontend `.env` (in `frontend/` folder)

Create a `.env` file with:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:4000
```

### Running the Project Locally

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:4000`

2. **Start the frontend dev server** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Open your browser** and navigate to `http://localhost:5173`

## Important Notes

- **Authentication Required**: You must create a Clerk account and set up an application to get the publishable and secret keys. Without this, the app won't authenticate users.

- **MongoDB Connection**: Make sure your MongoDB instance is running. If using MongoDB Atlas, whitelist your IP address in the network access settings.

- **File Uploads**: Uploaded files (logos, stamps, signatures) are stored in `backend/uploads/`. This folder is gitignored, so it won't be tracked in version control.

- **AI Feature**: The AI invoice parsing feature requires a valid Gemini API key. If you don't have one, the app will still work, but the AI modal won't function.

- **CORS**: The backend is configured to accept requests from `http://localhost:5173` by default. If you change the frontend port, update the `CLIENT_URL` in the backend `.env`.

- **Invoice Model Typo**: There's a typo in the invoice model file name (`Inovice` instead of `Invoice`). This is intentional to match the existing database collection name. Changing it would require a database migration.

## Future Improvements

- **Email Notifications** – Send invoices directly to clients via email
- **Recurring Invoices** – Auto-generate invoices on a schedule
- **Multi-Currency Support** – Better handling of different currencies with exchange rates
- **Payment Integration** – Accept payments through Stripe or PayPal
- **Invoice Templates** – Multiple design templates to choose from
- **Expense Tracking** – Track business expenses alongside invoices
- **Reports & Analytics** – Generate monthly/yearly financial reports
- **Dark Mode** – Full dark mode support across the app
- **Export to Excel** – Download invoice data as spreadsheets

## Contributing

Contributions are welcome! If you'd like to improve Bill-Wise:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and follow the existing code style.

---

Built with ❤️ by developers, for developers.
