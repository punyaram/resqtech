# ResqTech - INCOIS Ocean Hazard Reporter

ResqTech is a modern web application designed for reporting ocean-related hazards to the Indian National Centre for Ocean Information Services (INCOIS). It allows users to sign up, log in, and submit hazard reports, which are crucial for protecting coastal areas.

The application is built to be resilient, with features like offline support, ensuring that reports can be queued and synced automatically when a connection is available.

---

## Features

- User Authentication: Secure sign-up and sign-in functionality handled by Supabase.
- Hazard Reporting: A dedicated form for users to report ocean hazards.
- Interactive Map View: A central map page to visualize data.
- Offline Support: Reports can be created offline and are automatically synced to the server when the user is back online.
- Modern UI: Built with a responsive and clean user interface using shadcn/ui and Tailwind CSS.

---

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend & Database: Supabase (Backend-as-a-Service)
- Styling: Tailwind CSS, shadcn/ui
- State Management: Zustand (authStore)
- Routing: React Router DOM
- Data Fetching: TanStack Query

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have Node.js (version 18 or higher) and npm installed on your computer.

### Installation

1. Clone the repository:
   `git clone https://github.com/punyaram/resqtech.git`

2. Navigate to the project directory:
   `cd resqtech`

3. Install the dependencies:
   `npm install`

4. Set up your environment variables:
   - Create a new file in the root of the project named `.env`.
   - You will need to get your own Supabase Project URL and Anon Key from your Supabase project dashboard.

   `VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"`
   `VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_ANON_KEY"`

### Running the Application

Once the installation is complete, you can run the application in development mode:

`npm run dev`

This will start the development server. Open your browser and navigate to `http://localhost:5173` (or the URL shown in your terminal) to see the application running.
