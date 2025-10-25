#!/usr/bin/env node

// Simple test script to verify analytics functionality
const mongoose = require('mongoose');

// Test analytics model
const AnalyticsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  event_type: { type: String, required: true },
  game_id: { type: String, required: true },
  asset_type: { type: String, required: true },
  asset_url: { type: String, required: true },
  session_id: { type: String, required: true },
  metadata: { type: Object },
  user_id: { type: String, required: true },
  timestamp: { type: Date, required: true },
  variant_id: { type: String, default: null }
});

const Analytics = mongoose.model('Analytics', AnalyticsSchema, 'analytics');

async function testAnalytics() {
  try {
    // Connect to MongoDB (assuming local MongoDB)
    await mongoose.connect('mongodb://localhost:27017/mesulo', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Test creating an analytics event
    const testEvent = {
      id: 'test_' + Date.now(),
      event_type: 'hover',
      game_id: 'test-game-123',
      asset_type: 'defaultImage',
      asset_url: 'https://example.com/image.jpg',
      session_id: 'test-session-456',
      metadata: {
        hover_duration: 1500,
        device_type: 'desktop',
        viewport_width: 1920,
        viewport_height: 1080
      },
      user_id: 'test-user-789',
      timestamp: new Date()
    };
    
    const analytics = new Analytics(testEvent);
    await analytics.save();
    
    console.log('✅ Analytics event created successfully');
    console.log('📊 Event data:', testEvent);
    
    // Test querying analytics
    const events = await Analytics.find({ game_id: 'test-game-123' });
    console.log('✅ Found', events.length, 'analytics events');
    
    // Test aggregation
    const aggregated = await Analytics.aggregate([
      { $match: { game_id: 'test-game-123' } },
      { 
        $group: { 
          _id: { asset_type: '$asset_type', event_type: '$event_type' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('✅ Aggregation test successful');
    console.log('📈 Aggregated data:', aggregated);
    
    // Clean up test data
    await Analytics.deleteOne({ id: testEvent.id });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All analytics tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

testAnalytics();
