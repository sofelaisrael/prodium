# AGENTS.md

## Project Overview

**prodium** is a Medium Clone API built with Node.js and Express.js. It provides RESTful API endpoints for user authentication, article management, and content sharing.

## Technology Stack

- **Runtime**: Node.js (JavaScript/TypeScript)
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL with authentication)
- **Security**: JWT authentication, bcrypt password hashing, helmet, rate limiting
- **Environment**: dotenv

## Key Features

### User Authentication
- User registration with email/password
- Secure login with JWT tokens
- Password hashing with bcrypt

### Article Management
- Create, read, update, delete articles
- Article categorization
- Author attribution
- Publication control

### Security
- JWT-based authentication
- Rate limiting to prevent abuse
- CORS configuration
- Security headers with helmet

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Articles
- `GET /api/articles` - Get all articles
- `POST /api/articles` - Create new article (requires authentication)

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Supabase account

### Installation
1. Clone this repository
2. Copy `server/.env.example` to `server/.env` and fill in your Supabase credentials
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `server/.env` file with the following variables:

```
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
JWT_SECRET=your_jwt_secret_here
PORT=3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Project Structure

```
prodium/
├── server/                 # Backend API
│   ├── index.js           # Main entry point
│   ├── app.js             # Application setup and configuration
│   ├── auth.js            # Authentication utilities
│   ├── routes.js          # API route definitions
│   ├── .env.example       # Environment variable template
│   └── .env               # Environment variables (gitignored)
├── admin/                 # Admin panel (planned)
├── client/                # Frontend app (planned)
├── package.json           # Project dependencies and scripts
├── package-lock.json      # Dependency lock file
└── .gitignore             # Git ignore rules
```

## Development

### Running Tests

Currently, the project has a placeholder test script. To implement real tests:

1. Install a test framework (e.g., Jest, Mocha, or Supertest)
2. Update `package.json` scripts
3. Create test files in a `tests/` directory

Example test script update:
```json
"scripts": {
  "test": "jest",
  "dev": "nodemon server/index.js"
}
```

## Production Deployment

### Environment Configuration

For production deployment, ensure you have:

1. **Supabase Setup**: Create a Supabase project with authentication and database
2. **Environment Variables**: Set up production environment variables
3. **Security**: Use strong JWT secrets and HTTPS
4. **Monitoring**: Implement logging and monitoring

### Deployment Steps

1. Set up Supabase project
2. Configure environment variables
3. Deploy to hosting platform (Heroku, AWS, DigitalOcean, etc.)
4. Set up database migrations
5. Configure monitoring and logging

## Security Considerations

### Authentication
- Use strong JWT secrets
- Implement proper password hashing
- Add rate limiting
- Use HTTPS in production

### Database
- Use Supabase for secure database management
- Implement proper access controls
- Regularly backup data

### API
- Validate all input data
- Implement proper error handling
- Add security headers
- Use CORS appropriately

## Future Enhancements

### Planned Features
- User profiles and bio
- Article comments and reactions
- Search functionality
- Image upload support
- Email notifications
- Social media integration

### Technical Improvements
- Implement TypeScript for better type safety
- Add comprehensive test suite
- Implement caching for better performance
- Add API documentation (Swagger/OpenAPI)
- Implement CI/CD pipeline

## License

This project is licensed under the ISC License.

## Acknowledgments

- Thanks to Supabase for providing a secure and scalable backend-as-a-service
- Thanks to the Express.js community for the excellent web framework
- Thanks to the Node.js ecosystem for powerful development tools