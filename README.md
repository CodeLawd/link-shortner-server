# URL Shortener Application

A full-stack application for shortening URLs, built with Next.js (frontend) and NestJS (backend).

## Features

- Shorten long URLs to compact, shareable links
- View statistics for each shortened URL
- Search through your shortened URLs
- Track usage with visit counts and timestamps
- Responsive design for all devices

## Tech Stack

### Frontend

- **React** with **Next.js** framework
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Hook Form** for form handling

### Backend

- **NestJS** (Node.js framework)
- **TypeScript**
- **In-memory storage** (no database required)
- **Jest** for testing

## Setup Instructions

### Prerequisites

- Node.js (v16 or newer)
- Yarn package manager
- MongoDB (v5.0 or newer)

### Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/short-url.git
   cd short-url
   ```

2. Install backend dependencies

   ```
   cd server
   yarn install
   ```

3. Install frontend dependencies
   ```
   cd ../client
   yarn install
   ```

### MongoDB Setup

1. Install MongoDB locally by following the [official MongoDB installation guide](https://www.mongodb.com/docs/manual/installation/) for your operating system.

2. Start the MongoDB service:

   - On Linux: `sudo systemctl start mongod`
   - On macOS (with Homebrew): `brew services start mongodb-community`
   - On Windows: MongoDB should run as a service automatically after installation

3. Create a `.env` file in the server directory with your MongoDB connection string:

   ```
   cd server
   echo "MONGO_URI=mongodb://localhost:27017/url-shortener" > .env
   ```

   The default connection string is `mongodb://localhost:27017/url-shortener` if no environment variable is provided.

### Running the Application

1. Start the backend server

   ```
   cd server
   yarn start:dev
   ```

   The server will run on http://localhost:3001

2. Start the frontend development server

   ```
   cd client
   yarn dev
   ```

   The frontend will run on http://localhost:3000

3. Open your browser and navigate to http://localhost:3000

## API Endpoints

### Backend API

- **POST /api/encode**

  - Accepts: `{ "url": "https://example.com" }`
  - Returns: `{ "shortUrl": "http://short.est/GeAi9K" }`

- **POST /api/decode**

  - Accepts: `{ "shortUrl": "http://short.est/GeAi9K" }`
  - Returns: `{ "url": "https://example.com" }`

- **GET /api/statistic/:url_path**

  - Returns statistics for the given URL path

- **GET /api/list**

  - Returns a list of all shortened URLs with their metadata

- **GET /:url_path**
  - Redirects to the original URL

## Running Tests

### Backend Tests

The backend tests use a mocked MongoDB model, so you don't need an actual MongoDB instance running to execute the tests.

```
cd server
yarn test
```

### End-to-End Tests

For end-to-end tests, you will need a MongoDB instance. The tests will use the same database configuration as your application.

```
cd server
yarn test:e2e
```

### Test Coverage

To generate test coverage reports:

```
cd server
yarn test:cov
```

## Implementation Details

- The application uses MongoDB to store URL data
- URL encoding uses nanoid for generating unique short paths
- The application tracks statistics for each URL, including creation date, visit count, and last visit timestamp

## License

MIT
