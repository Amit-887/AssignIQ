const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/assigniq';

const clearAllData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    let totalDeleted = 0;

    // Clear each collection except users (already handled)
    for (const collection of collections) {
      const collectionName = collection.name;
      if (collectionName !== 'users') {
        const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
        totalDeleted += result.deletedCount;
        console.log(`Cleared ${result.deletedCount} documents from '${collectionName}' collection`);
      }
    }

    console.log(`\n✅ Successfully cleared ${totalDeleted} documents from all collections!`);
    console.log('🔄 Database is now completely fresh except for the new admin user.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

clearAllData();
