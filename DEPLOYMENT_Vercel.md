# Deployment Guide: Vercel + MongoDB Atlas

Follow these steps to deploy your project to production.

## 1. MongoDB Atlas Setup (Cloud Database)

Since Vercel is serverless, you cannot use a local MongoDB. You must use a cloud database like MongoDB Atlas.

1.  **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account.
2.  **Create Cluster**: Choose the **FREE Shared Cluster** (M0). Select a region close to your target users.
3.  **Database Access**: 
    - Create a database user.
    - Give them a username and a **strong password** (save these).
    - Assign the role **"Read and Write to any database"**.
4.  **Network Access**:
    - Add IP Address `0.0.0.0/0`. 
    - *Note: This is required because Vercel Serverless Functions change their IP addresses constantly.*
5.  **Get Connection String**:
    - Go to **Database** → **Connect** → **Connect your application**.
    - Copy the connection string. It will look like this:
      `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
    - Replace `<username>` and `<password>` with your database user credentials.
    - Set the database name to `student_dropout_db` in the URI or in the environment variables.

---

## 2. Backend Deployment (FastAPI)

1.  **Link Repo**: Go to [Vercel](https://vercel.com/), click **"Add New"** → **"Project"**.
2.  **Select Directory**: Point the root directory to `dropout-back-main`.
3.  **Environment Variables**: Add these in the Vercel dashboard:
    - `MONGODB_URL`: Your MongoDB Atlas URI.
    - `DATABASE_NAME`: `student_dropout_db`
    - `SECRET_KEY`: A long random string.
    - `JWT_SECRET_KEY`: Another long random string.
4.  **Deploy**: Click Deploy. Once finished, copy your backend URL (e.g., `https://dropout-back.vercel.app`).

---

## 3. Frontend Deployment (React)

1.  **Add New Project**: In Vercel, add another project from the same repo.
2.  **Select Directory**: Point the root directory to `dropout-front-main`.
3.  **Environment Variables**: Add these in the Vercel dashboard:
    - `REACT_APP_API_URL`: Your **Backend URL** from Step 2.
    - `REACT_APP_FIREBASE_API_KEY`: (From your current .env)
    - `REACT_APP_FIREBASE_AUTH_DOMAIN`: (From your current .env)
    - `REACT_APP_FIREBASE_PROJECT_ID`: (From your current .env)
    - `REACT_APP_FIREBASE_STORAGE_BUCKET`: (From your current .env)
    - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`: (From your current .env)
    - `REACT_APP_FIREBASE_APP_ID`: (From your current .env)
    - `REACT_APP_FIREBASE_MEASUREMENT_ID`: (From your current .env)
    - `REACT_APP_GOOGLE_CLIENT_ID`: (From your current .env)
4.  **Deploy**: Click Deploy.

---

## 4. Final Verification

1. Open your frontend URL.
2. Try to log in or submit the assessment form.
3. Check the **Vercel Logs** if you encounter any issues.
