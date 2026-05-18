const { MongoClient } = require('mongodb');
require('dotenv').config();

let db = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'strictly-friendly-app';

async function connectToDatabase() {
  try {
    if (db) {
      return db;
    }

    const client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    db = client.db(DB_NAME);
    console.log(`✅ Using database: ${DB_NAME}`);
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

async function getDatabase() {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}

module.exports = {
  connectToDatabase,
  getDatabase
};
