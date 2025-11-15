const OpenAI = require('openai');
const { logPrompt, logStep, logError, logSuccess } = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Enriches a prompt with context using OpenAI, intelligently incorporating user prompts
 * @param {string} basePrompt - The base prompt (casino game instructions)
 * @param {string} userPrompt - The user's custom prompt (optional)
 * @param {object} metadata - Context metadata (imageUrl, assetType, etc.)
 * @returns {Promise<string>} - The enriched prompt
 */
async function enrichPromptWithContext(basePrompt, userPrompt = '', metadata = {}) {
  try {
    logPrompt('ENRICH INPUT', 'Base Prompt', basePrompt);
    if (userPrompt && userPrompt.trim()) {
      logPrompt('ENRICH INPUT', 'User Prompt', userPrompt);
    }
    
    logStep('🤖', 'Enriching prompt with OpenAI...');
    
    // Build the context message that includes both base and user prompts
    let promptContext = basePrompt;
    if (userPrompt && userPrompt.trim()) {
      promptContext = `${basePrompt}\n\nUser's specific request: ${userPrompt.trim()}`;
    }
    
    const contextMessage = `You are helping to create an enhanced prompt for generating casino game assets.

Base requirements: ${basePrompt}${userPrompt && userPrompt.trim() ? `\n\nUser's specific request: ${userPrompt.trim()}` : ''}

Context:
- Asset Type: ${metadata.assetType || 'current'}
- Image URL: ${metadata.imageUrl || 'N/A'}

Create a single, comprehensive prompt that:
1. Incorporates all the base requirements
2. Intelligently integrates the user's specific request (if provided) into the base requirements
3. Adds professional details about visual style, composition, and quality
4. Maintains the user's intent while enhancing clarity and effectiveness

Return only the final enhanced prompt, no explanations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating detailed prompts for AI image and video generation, specializing in casino game assets.'
        },
        {
          role: 'user',
          content: contextMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const enrichedPrompt = response.choices[0].message.content.trim();
    
    // Calculate original combined prompt length
    const originalPrompt = userPrompt && userPrompt.trim() 
      ? `${basePrompt} ${userPrompt.trim()}` 
      : basePrompt;
    
    logPrompt('STEP 2', 'Enriched Prompt', enrichedPrompt, { 
      originalLength: originalPrompt.length,
      enrichedLength: enrichedPrompt.length
    });
    
    logSuccess('Prompt enriched successfully');
    
    return enrichedPrompt;
  } catch (error) {
    logError('Failed to enrich prompt', error);
    // Return original combined prompt if enrichment fails
    logStep('⚠️', 'Using original prompt due to enrichment failure');
    const fallbackPrompt = userPrompt && userPrompt.trim() 
      ? `${basePrompt} ${userPrompt.trim()}` 
      : basePrompt;
    return fallbackPrompt;
  }
}

module.exports = {
  enrichPromptWithContext
};

