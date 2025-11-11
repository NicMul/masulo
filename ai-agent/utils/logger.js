/**
 * Structured logging utility for AI Agent Server
 * Logs prompts and steps throughout the media pipeline
 */

function logStep(emoji, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`${emoji} [${timestamp}] ${message}`);
  if (data) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

function logPrompt(step, promptType, prompt, context = null) {
  const timestamp = new Date().toISOString();
  console.log(`📝 [${timestamp}] ${step} - ${promptType}:`);
  console.log(`   "${prompt}"`);
  if (context) {
    console.log('   Context:', JSON.stringify(context, null, 2));
  }
}

function logError(message, error) {
  const timestamp = new Date().toISOString();
  console.error(`❌ [${timestamp}] ${message}`);
  if (error) {
    console.error('   Error:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
  }
}

function logSuccess(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`✅ [${timestamp}] ${message}`);
  if (data) {
    console.log('   Result:', JSON.stringify(data, null, 2));
  }
}

module.exports = {
  logStep,
  logPrompt,
  logError,
  logSuccess
};

