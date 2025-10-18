require('dotenv').config();
const mongo = require('./model/mongo');
const email = require('./model/email');

async function checkAllTemplates() {
  try {
    console.log('Connecting to MongoDB...');
    await mongo.connect();
    
    console.log('\n📧 Checking email templates in database...\n');
    
    // List of all templates that should exist (from seed files)
    const expectedTemplates = [
      'new_account',
      'duplicate_user', 
      'new_plan',
      'new_user',
      'plan_updated',
      'plan_updated_free',
      'card_updated',
      'card_failed',
      'card_expiring',
      'invite',
      'contact',
      'feedback',
      'magic_signin',
      'new_signin',
      'blocked_signin',
      'help',
      'new_log',
      'email_verification',
      'trial_expiring',
      'trial_expired',
      'unverified_account'
    ];
    
    const missingTemplates = [];
    const existingTemplates = [];
    
    for (const templateName of expectedTemplates) {
      const template = await email.get({ name: templateName, locale: 'en' });
      if (template) {
        existingTemplates.push(templateName);
        console.log(`✅ ${templateName}`);
      } else {
        missingTemplates.push(templateName);
        console.log(`❌ ${templateName} - MISSING`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Found: ${existingTemplates.length} templates`);
    console.log(`❌ Missing: ${missingTemplates.length} templates`);
    
    if (missingTemplates.length > 0) {
      console.log(`\n🔧 Missing templates:`);
      missingTemplates.forEach(template => console.log(`   - ${template}`));
    }
    
  } catch (error) {
    console.error('Error checking templates:', error.message);
  }
  
  process.exit(0);
}

checkAllTemplates();
