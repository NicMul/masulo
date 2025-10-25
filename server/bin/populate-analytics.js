#!/usr/bin/env node

/**
 * Script to populate sample analytics data for testing
 */

const mongoose = require('mongoose');
const analytics = require('../model/analytics');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mesolu', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const sampleEvents = [
  // Hover events
  { event_type: 'hover', game_id: 'game_001', asset_type: 'themeImage', asset_url: 'https://example.com/theme1.jpg', session_id: 'sess_001' },
  { event_type: 'hover', game_id: 'game_001', asset_type: 'themeImage', asset_url: 'https://example.com/theme1.jpg', session_id: 'sess_002' },
  { event_type: 'hover', game_id: 'game_002', asset_type: 'currentImage', asset_url: 'https://example.com/current1.jpg', session_id: 'sess_001' },
  { event_type: 'hover', game_id: 'game_003', asset_type: 'defaultImage', asset_url: 'https://example.com/default1.jpg', session_id: 'sess_003' },
  
  // Click events
  { event_type: 'click', game_id: 'game_001', asset_type: 'themeImage', asset_url: 'https://example.com/theme1.jpg', session_id: 'sess_001' },
  { event_type: 'click', game_id: 'game_002', asset_type: 'currentImage', asset_url: 'https://example.com/current1.jpg', session_id: 'sess_002' },
  
  // Video events
  { event_type: 'video_play', game_id: 'game_001', asset_type: 'themeVideo', asset_url: 'https://example.com/theme1.mp4', session_id: 'sess_001' },
  { event_type: 'video_pause', game_id: 'game_001', asset_type: 'themeVideo', asset_url: 'https://example.com/theme1.mp4', session_id: 'sess_001' },
  { event_type: 'video_play', game_id: 'game_004', asset_type: 'currentVideo', asset_url: 'https://example.com/current2.mp4', session_id: 'sess_004' },
  
  // Touch events
  { event_type: 'touch', game_id: 'game_003', asset_type: 'defaultImage', asset_url: 'https://example.com/default1.jpg', session_id: 'sess_003' },
  { event_type: 'touch', game_id: 'game_005', asset_type: 'promoImage', asset_url: 'https://example.com/promo1.jpg', session_id: 'sess_005' },
];

async function populateData() {
  try {
    console.log('🗑️  Clearing existing analytics data...');
    await mongoose.connection.db.collection('analytics').deleteMany({});
    
    console.log('📊 Creating sample analytics events...');
    
    for (const eventData of sampleEvents) {
      const analyticsData = {
        ...eventData,
        user_id: 'test_user_001',
        account_id: 'test_account_001',
        metadata: {
          viewport: { width: 1920, height: 1080 },
          device: 'desktop',
          browser: 'chrome'
        }
      };
      
      await analytics.create({ 
        data: analyticsData, 
        user: 'test_user_001', 
        account: 'test_account_001' 
      });
    }
    
    console.log(`✅ Created ${sampleEvents.length} sample analytics events`);
    console.log('🎯 You can now view the analytics dashboard with real data!');
    
  } catch (error) {
    console.error('❌ Error populating data:', error);
  } finally {
    mongoose.connection.close();
  }
}

populateData();
