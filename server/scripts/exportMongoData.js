const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection settings - match project configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.DB_NAME || 'strictly-friendly-app'; // Changed to DB_NAME
const EXPORT_DIR = './mongodb_exports';

async function exportMongoData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`🔗 Connection URI: ${MONGODB_URI}`);
    console.log(`🗄️ Database: ${DATABASE_NAME}`);
    
    await client.connect();
    console.log('✅ MongoDB connection successful');
    
    // Check available databases list
    const adminDb = client.db('admin');
    const databases = await adminDb.admin().listDatabases();
    console.log('\n📋 Available databases:');
    databases.databases.forEach(db => {
      console.log(`   - ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    const db = client.db(DATABASE_NAME);
    
    // Create export directory
    if (!fs.existsSync(EXPORT_DIR)) {
      fs.mkdirSync(EXPORT_DIR, { recursive: true });
      console.log(`📁 Export directory created: ${EXPORT_DIR}`);
    }
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📊 Collections found: ${collections.length}`);
    
    if (collections.length === 0) {
      console.log('⚠️ No collections found. Please check:');
      console.log('   1. Database name is correct');
      console.log('   2. MongoDB actually has data');
      console.log('   3. Environment variable DB_NAME is set correctly');
      
      // Check database statistics
      try {
        const stats = await db.stats();
        console.log(`\n📊 Database statistics:`);
        console.log(`   - Collections: ${stats.collections}`);
        console.log(`   - Documents: ${stats.objects}`);
        console.log(`   - Data size: ${stats.dataSize} bytes`);
        console.log(`   - Storage size: ${stats.storageSize} bytes`);
      } catch (statsError) {
        console.log('❌ Cannot get database statistics:', statsError.message);
      }
    }
    
    const exportResults = [];
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n📤 Exporting ${collectionName} collection...`);
      
      try {
        // Get collection data
        const data = await db.collection(collectionName).find({}).toArray();
        console.log(`   📄 ${data.length} documents found`);
        
        // Save as JSON file
        const fileName = `${collectionName}_${new Date().toISOString().split('T')[0]}.json`;
        const filePath = path.join(EXPORT_DIR, fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`   💾 Saved to ${fileName}`);
        
        exportResults.push({
          collection: collectionName,
          documents: data.length,
          file: fileName,
          size: fs.statSync(filePath).size
        });
        
      } catch (error) {
        console.error(`   ❌ Failed to export ${collectionName}:`, error.message);
        exportResults.push({
          collection: collectionName,
          error: error.message
        });
      }
    }
    
    // Create export summary
    const summary = {
      exportDate: new Date().toISOString(),
      database: DATABASE_NAME,
      totalCollections: collections.length,
      successfulExports: exportResults.filter(r => !r.error).length,
      failedExports: exportResults.filter(r => r.error).length,
      results: exportResults
    };
    
    const summaryPath = path.join(EXPORT_DIR, 'export_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    
    console.log('\n🎉 Export completed!');
    console.log(`📊 Total collections: ${summary.totalCollections}`);
    console.log(`✅ Successful: ${summary.successfulExports}`);
    console.log(`❌ Failed: ${summary.failedExports}`);
    console.log(`📁 Export location: ${path.resolve(EXPORT_DIR)}`);
    console.log(`📋 Summary file: export_summary.json`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run script
if (require.main === module) {
  exportMongoData().catch(console.error);
}

module.exports = { exportMongoData };
