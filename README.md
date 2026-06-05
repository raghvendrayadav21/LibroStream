# 📚 LibroStream (SmartLMS) — College Library Management System

LibroStream (SmartLMS) is a state-of-the-art, multi-tenant, QR-enabled College Library Management System. Designed for modern higher education institutions, it eliminates physical library cards by issuing digital ID cards with secure QR codes for contactless book issues and returns.

---

## 🚀 Key Features

### 🏢 Multi-Tenant Architecture
*   **Scoped Access:** Multiple colleges can register on the system.
*   **Email Domain Validation:** Students are automatically grouped into their respective colleges based on their registration email domains (e.g., `@mitindore.edu`).
*   **Custom Settings:** Each college defines its own book loan duration (e.g., 14 days) and daily overdue penalty rates (e.g., ₹5/day).

### 🔐 Secure Authentication & Onboarding
*   **OTP-Verified Registration:** Registration enforces email verification with a secure 6-digit OTP code before accounts are created.
*   **Digital ID Card & QR Codes:** Upon successful registration, the backend automatically generates a secure, collision-free library card number (`LIB-{YEAR}-{UUID_SHORT}`) and renders a Base64-encoded QR code.
*   **Forgot & Reset Password:** Complete secure workflow using OTP tokens sent straight to the user's registered college email address.

### 📖 Inventory & Book Management
*   **Add & Bulk Import:** Admins can insert books singly or perform bulk uploads via JSON arrays.
*   **Real-time Availability Tracking:** When books are issued or returned, available copies update dynamically.
*   **Update details:** Dynamic updates of book details with strict boundary checks to prevent reducing copies below what is currently checked out.

### ⏱️ Transactions, Penalties & Reminders
*   **Contactless Scan:** Admins scan the student's QR code to view their profile, active borrowings, and live penalty calculation.
*   **Automatic Overdue Job:** A daily background job marks delayed loans as `OVERDUE` and sends email notifications.
*   **Penalty Clearance:** Admins have the ability to clear or waive off outstanding book fines.

---

## 🛠️ Tech Stack

*   **Backend:** Java 17 + Spring Boot 3.2.5 + Spring Security
*   **Database:** MongoDB
*   **Frontend:** React 19 + Vite + TailwindCSS v4
*   **Libraries:**
    *   `jjwt` for JWT authentication
    *   `zxing` for QR Code generation
    *   `spring-dotenv` for loading environment variables
    *   `spring-boot-starter-mail` for SMTP email delivery

---

## ⚙️ Project Setup & Installation

### 1. Database Setup
Ensure that a local MongoDB instance is running, or obtain a MongoDB Atlas URI connection string.

### 2. Backend Setup
1.  Navigate to the `backend/` directory.
2.  Create a `.env` file in the `backend/` root directory to declare your environment variables:
    ```env
    # Database Configuration
    SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/smartlms
    
    # Mail Server Configuration
    SPRING_MAIL_HOST=smtp.gmail.com
    SPRING_MAIL_PORT=587
    SPRING_MAIL_USERNAME=your-email@gmail.com
    SPRING_MAIL_PASSWORD=your-app-specific-password
    
    # JWT Configuration
    JWT_SECRET=your_super_secret_jwt_key_with_at_least_256_bits_length_here
    
    # OTP Expiry (minutes)
    APP_OTP_EXPIRY_MINUTES=10
    ```
3.  Build and run the Spring Boot application using Maven:
    ```bash
    mvn clean install
    mvn spring-boot:run
    ```
    The backend will start on `http://localhost:8080` with the base API route `/api`.

### 3. Frontend Setup
1.  Navigate to the `frontend/` directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    Open the local address shown in terminal (usually `http://localhost:5173`).

---

## 📊 API Endpoints Summary

### Public Authentication (`/api/auth`)
*   `POST /api/auth/send-otp` — Sends a registration OTP to the provided email.
*   `POST /api/auth/register` — Verifies the OTP and creates the student account.
*   `POST /api/auth/login` — Returns a valid JWT auth token and user metadata.
*   `POST /api/auth/resend-otp` — Resends a verification OTP code.
*   `POST /api/auth/forgot-password` — Generates a password reset OTP code.
*   `POST /api/auth/reset-password` — Verifies the password reset OTP and sets the new password.

### Admin Dashboard Control (`/api/admin`)
*   `GET /api/admin/dashboard/stats` — Fetches counts for total students, total books, issued, overdue, returned today, and pending fines.
*   `GET /api/admin/books` — Gets all books inventory (supports title/author search or filtering by category).
*   `POST /api/admin/books` — Adds a single new book.
*   `PUT /api/admin/books/{bookId}` — Updates book details.
*   `DELETE /api/admin/books/{bookId}` — Removes a book from inventory.
*   `GET /api/admin/students` — Lists all registered students in the admin's college.
*   `PUT /api/admin/student/{studentId}/toggle-status` — Blocks or unblocks a student account.
*   `GET /api/admin/transactions` — Lists all book transactions (issued, overdue, returned).
*   `POST /api/admin/issue` — Issues a book to a student.
*   `PUT /api/admin/return/{transactionId}` — Marks a book return.
*   `PUT /api/admin/penalty/{transactionId}/clear` — Waives off transaction penalties.
