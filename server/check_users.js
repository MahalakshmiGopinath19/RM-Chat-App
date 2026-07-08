const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rm-chat-app';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users in database:`);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) - Employee ID: ${u.employeeId} - Role: ${u.role}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
