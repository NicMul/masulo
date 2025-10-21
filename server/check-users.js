#!/usr/bin/env node

// Quick script to check users in MongoDB
require('dotenv').config();
const mongo = require('./model/mongo');
const user = require('./model/user');

async function checkUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongo.connect();
    
    console.log('Checking for user: b4a40dc5-e950-4e6b-bca9-1ae51589b2b5');
    const specificUser = await user.get({ id: 'b4a40dc5-e950-4e6b-bca9-1ae51589b2b5' });
    console.log('Specific user result:', specificUser);
    
    console.log('\nListing all users:');
    const allUsers = await user.get({});
    console.log('Total users found:', allUsers.length);
    
    if (allUsers.length > 0) {
      console.log('First few users:');
      allUsers.slice(0, 3).forEach((u, i) => {
        console.log(`${i + 1}. ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
