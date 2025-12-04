const mongoose = require('mongoose');

// Replace with your actual MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview_ai';

console.log('Attempting to connect to:', MONGODB_URI.replace(/\/\/(.*?):(.*?)@/, '//****:****@'));

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB');
  mongoose.connection.close();
  process.exit(0);
})
.catch((err) => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  process.exit(1);
});