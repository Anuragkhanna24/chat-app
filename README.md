A full-stack MERN project with secure authentication and real-time chat built for the Talent Hubx assignment.

Features

Signup/Login with email or mobile number (unique per user).

Passwords stored securely (hashed).

Social login (Google/Facebook/LinkedIn).

Real-time chat with Socket.IO.

File & video sharing.

User management (Add, Edit, Delete users).

Chat history saved in MongoDB.

Tech Stack

Frontend: React, Tailwind CSS

Backend: Node.js, Express.js, Socket.IO

Database: MongoDB (Atlas)

Deployment: Vercel (frontend), Render/Heroku (backend)

⚙️ Setup

Clone repo

git clone https://github.com/your-username/alpha-chat-app.git
cd alpha-chat-app


Install backend

cd server && npm install


Create .env with:

MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret


Start: npm run dev

Install frontend

cd client && npm install
npm run dev

