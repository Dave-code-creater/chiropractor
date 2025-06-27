// MongoDB initialization script for Chiropractor Clinic
print('🏥 Initializing MongoDB for Chiropractor Clinic...');

// Switch to clinic database
db = db.getSiblingDB('chiropractor_clinic');

// Create collections with initial data
db.createCollection('blog_posts');
db.createCollection('conversations');
db.createCollection('messages');
db.createCollection('file_uploads');
db.createCollection('chat_users');

// Create indexes for better performance
db.blog_posts.createIndex({ "createdAt": -1 });
db.blog_posts.createIndex({ "published": 1 });
db.blog_posts.createIndex({ "tags": 1 });

db.conversations.createIndex({ "participants": 1 });
db.conversations.createIndex({ "lastActivity": -1 });

db.messages.createIndex({ "conversationId": 1, "createdAt": -1 });
db.messages.createIndex({ "senderId": 1 });

db.file_uploads.createIndex({ "uploadedAt": -1 });
db.file_uploads.createIndex({ "patientId": 1 });

// Insert sample blog posts for clinic
db.blog_posts.insertMany([
  {
    title: "Understanding Chiropractic Care: A Comprehensive Guide",
    content: "Chiropractic care focuses on the diagnosis and treatment of neuromuscular disorders...",
    author: "Dr. Dieu Phan D.C",
    published: true,
    tags: ["chiropractic", "health", "wellness"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "5 Benefits of Regular Chiropractic Adjustments",
    content: "Regular chiropractic care can provide numerous health benefits including pain relief...",
    author: "Dr. Dieu Phan D.C",
    published: true,
    tags: ["benefits", "adjustments", "pain-relief"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Common Causes of Back Pain and How to Prevent Them",
    content: "Back pain is one of the most common reasons people visit healthcare providers...",
    author: "Dr. Dieu Phan D.C",
    published: true,
    tags: ["back-pain", "prevention", "health-tips"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Create test database
db = db.getSiblingDB('chiropractor_clinic_test');

// Create test collections
db.createCollection('blog_posts');
db.createCollection('conversations');
db.createCollection('messages');
db.createCollection('file_uploads');
db.createCollection('chat_users');

// Create same indexes for test database
db.blog_posts.createIndex({ "createdAt": -1 });
db.conversations.createIndex({ "participants": 1 });
db.messages.createIndex({ "conversationId": 1, "createdAt": -1 });

print('✅ MongoDB initialized successfully');
print('   - Production DB: chiropractor_clinic');
print('   - Test DB: chiropractor_clinic_test');
print('   - Sample blog posts created');
print('   - Indexes created for optimal performance'); 