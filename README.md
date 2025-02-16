🚗 Stright Deal API
Stright Deal API is a backend service designed to help users sell their cars quickly and efficiently. It features a secure authentication system, a robust database for managing car listings, and seamless integration with frontend applications. The API is deployed on Vercel for optimal performance and scalability.

🚀 Tech Stack
Backend Framework: Express.js

Database: Supabase

ORM: Prisma

Authentication: JWT (JSON Web Tokens)

Deployment: Vercel

🛠 Installation & Setup
Prerequisites
Before you begin, ensure you have the following installed:

Node.js (v16 or higher recommended)

npm or Yarn (package manager)

Steps
1️⃣ Clone the repository

bash
Copy
git clone https://github.com/your-repo/stright-deal-api.git
cd stright-deal-api
2️⃣ Install dependencies

bash
Copy
npm install
3️⃣ Set up environment variables

Create a .env file in the root directory and add the following variables:

env
Copy
DATABASE_URL=your_supabase_database_url
ACCESS_TOKEN_SECRET=your_jwt_secret
4️⃣ Run database migrations

bash
Copy
npx prisma migrate dev
5️⃣ Start the server

bash
Copy
npm run dev
The API will now be running locally at http://localhost:3000 🚀

📄 API Endpoints
Here are some of the key endpoints available:

POST /api/auth/register - Register a new user

POST /api/auth/login - Log in and receive a JWT token

GET /api/listings - Fetch all car listings

POST /api/listings - Create a new car listing

PUT /api/listings/:id - Update a car listing

DELETE /api/listings/:id - Delete a car listing

📄 License
This project is licensed under the MIT License. See the LICENSE file for details.

🤝 Contributing
Contributions are welcome! If you'd like to contribute, please follow these steps:

Fork the repository.

Create a new branch for your feature or bugfix.

Commit your changes.

Submit a pull request.

📧 Contact
For any questions or inquiries, feel free to reach out:

Email: your-email@example.com

GitHub Issues: Open an Issue

Enjoy using Stright Deal API! 🚀

