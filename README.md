🚗 Stright Deal API
Stright Deal API is a backend service that allows users to sell their cars quickly and efficiently. It provides a secure authentication system and a robust database for managing listings. This API is deployed on Vercel and designed for seamless integration with frontend applications.

🚀 Tech Stack
Backend Framework: Express.js
Database: Supabase
ORM: Prisma
Authentication: JWT
Deployment: Vercel
🛠 Installation & Setup
Prerequisites
Before starting, ensure you have the following installed:

Node.js
npm or Yarn
Steps
1️⃣ Clone the repository

sh
Copy
Edit
git clone https://github.com/your-repo/stright-deal-api.git  
cd stright-deal-api  
2️⃣ Install dependencies

sh
Copy
Edit
npm install  
3️⃣ Set up environment variables
Create a .env file in the root directory and add the required environment variables:

env
Copy
Edit
DATABASE_URL=your_supabase_database_url  
ACCESS_TOKEN_SECRET=your_jwt_secret  
4️⃣ Run database migrations

sh
Copy
Edit
npx prisma migrate dev  
5️⃣ Start the server

sh
Copy
Edit
npm run dev  
The API should now be running locally on http://localhost:3000 🚀

📄 License
This project is licensed under the MIT License.
