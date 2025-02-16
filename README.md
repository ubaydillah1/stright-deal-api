# 🚗 Stright Deal API  

Stright Deal API is a backend service designed to help users sell their cars quickly and efficiently. It features a secure authentication system, a robust database for managing car listings, and seamless integration with frontend applications. The API is deployed on **Vercel** for optimal performance and scalability.  

---

## 🚀 Tech Stack  

- **Backend Framework:** Express.js  
- **Database:** Supabase  
- **ORM:** Prisma  
- **Authentication:** JWT (JSON Web Tokens)  
- **Deployment:** Vercel  

---

## 🛠 Installation & Setup  

### Prerequisites  
Before you begin, ensure you have the following installed:  

- Node.js (v16 or higher recommended)  
- npm or Yarn (package manager)  

**1️⃣ Clone the repository:**  
```bash
git clone https://github.com/your-repo/stright-deal-api.git  
cd stright-deal-api
```

**2️⃣ Install dependencies:**
```bash
npm install
```

**3️⃣ Set up environment variables:**
PORT=3000
HOST=localhost

```bash
CLIENT_URL=Client_URL
SERVER_URL=Server_Url
DOMAIN=Domain_Client

GOOGLE_CLIENT_ID=Google_Client
GOOGLE_CLIENT_SECRET=Google_Secret

JWT_REFRESH_TOKEN_SECRET=Access_Token
JWT_ACCESS_TOKEN_SECRET=Refresh_Token

TWILIO_ACCOUNT_SID=Twilio_SID
TWILIO_AUTH_TOKEN=Twilio_Token
TWILIO_PHONE_NUMBER=Phone_Number

SENDER_EMAIL=Sender_Email
SENDER_NAME=Sender_Name
SENDGRID_API_KEY=Sendgrid_API

SUPABASE_URL=Supabase_URL
SUPABASE_ANON_KEY=Anon_Key_Supabase

DATABASE_URL=Db_URL
```

**5️⃣ Start the server:**
```bash
npm run dev  
```


