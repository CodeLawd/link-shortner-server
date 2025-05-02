import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';

let mongod: MongoMemoryServer;

// Start in-memory MongoDB server for testing
export const setupMongoDB = async () => {
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  
  // Set up mongoose for testing
  await mongoose.connect(mongoUri);
  
  // Provide the test URI to the environment
  process.env.MONGO_URI = mongoUri;
};

// Clean up after tests
export const teardownMongoDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

// Clear all collections after each test
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}; 