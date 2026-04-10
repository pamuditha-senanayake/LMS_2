# LMS IUAP - Full Stack Application

A Learning Management System (LMS) built with a **Next.js** frontend and a **Spring Boot** backend. 

## Features
- **Frontend**: Next.js 15, React, Tailwind CSS, TypeScript
- **Backend**: Spring Boot 3, Spring Security, Java 17+
- **Database**: MongoDB (Atlas)
- **Authentication**: Secure HttpOnly Cookie-Based JWT Session Management
  - **Registration Routes**: Separate pathways for Admin (`/register/admin`), Lecturer (`/register/lecturer`), and Student (`/register`).
- **SSO**: Fully integrated Google Sign-In (`@react-oauth/google` & `google-api-client`)
- **UI/UX**: Premium dark mode aesthetics with responsive glassmorphism layouts and animations

---

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
- [Java 17](https://adoptium.net/) or higher
- [Node.js](https://nodejs.org/en/) (v18+)
- A **MongoDB Atlas** Cluster (You will need the connection URI).
- A **Google Web Client ID** (From the [Google Cloud Console](https://console.cloud.google.com/)).

---

## 🛠️ Step-by-Step Installation

### 1. Clone the repository
```bash
git clone https://github.com/pamuditha-senanayake/LMS_IUAP.git
cd LMS_IUAP
```

### 2. Backend Setup (Spring Boot)
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Configure your environment variables. 
   Optionally, you can create a `.env` file in the `backend/src/main/resources/` (or simply export them in your terminal) OR modify the `application.properties` directly.
   However, the easiest way is to add these to your environment or run the backend like this:
   
   If you rely on your existing `application.properties`, make sure the MongoDB URI and Google Client ID are properly pasted. The current `src/main/resources/application.properties` already has defaults:
   ```properties
   spring.application.name=backend
   spring.data.mongodb.uri=${MONGO_URI:mongodb:xxx}
   google.client.id=${GOOGLE_CLIENT_ID:xxxx}
   ```
   *Note: If MongoDB throws a connection error, go to the Atlas Dashboard **Network Access** tab and whitelist your IP `0.0.0.0/0`.*

3. Run the development server using the Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
   *(Or run it using your IDE like IntelliJ/VS Code).* The backend API will start securely on `http://localhost:8080`.

### 3. Frontend Setup (Next.js)
1. Open a **new** separate terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install all frontend dependencies:
   ```bash
   npm install
   ```
3. Set up the local environment variables. **Create a file exactly named `.env.local` inside the `frontend` directory** and copy-paste the following code into it:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The Next.js application will boot up at `http://localhost:3000`. Open this URL in your browser to see the live app!

---

---

## ✅ Quality Assurance & Security

This project is reinforced with automated quality guardrails and security scanning to ensure a robust and reliable application.

### 1. CI/CD Pipeline (GitHub Actions)
The project includes a **GitHub Actions** workflow that triggers on every push or pull request to the `main` branch.
- **Frontend Job:** Runs type-checking, linting, unit tests, security audits, and production builds.
- **Backend Job:** Executes a full Maven build, runs JUnit tests, and performs security analysis with SpotBugs and OWASP Dependency Check.

### 2. Automated Testing
- **Frontend:** Powered by **Vitest** and **React Testing Library**. 
  - To run tests: `cd frontend && npm run test`
- **Backend:** Powered by **JUnit 5** and **Mockito**.
  - To run tests: `cd backend && ./mvnw test`

### 3. Security Infrastructure
- **Dependency Scanning:** We use `npm audit` (frontend) and **OWASP Dependency Check** (backend) to automatically block the introduction of vulnerable third-party libraries.
- **Static Analysis (SAST):**
  - **ESLint Security Plugin:** Scans frontend code for potential injection or insecure syntax.
  - **SpotBugs (FindSecBugs):** Analyzes Java bytecode for OWASP Top 10 vulnerabilities.
- **Input Validation:** All backend endpoints are secured with **Jakarta Validation** (`@Valid`) and a **Global Exception Handler** to prevent data corruption and sensitive information leakage.

---
