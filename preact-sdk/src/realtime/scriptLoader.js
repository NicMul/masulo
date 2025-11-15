/**
 * Extracts the application key from the script tag that loaded this SDK
 * Looks for data-application-key attribute on the current script tag
 */
export function getApplicationKeyFromScript() {
  // Get all script tags
  const scripts = document.getElementsByTagName('script');
  
  // Find the script tag that contains this SDK
  // Check if any script has the mesulo-preact-sdk in its src
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    const src = script.getAttribute('src') || '';
    
    // Check if this script tag has the application key
    if (script.hasAttribute('data-application-key')) {
      return script.getAttribute('data-application-key');
    }
    
    // Also check if src contains mesulo-preact-sdk
    if (src.includes('mesulo-preact-sdk')) {
      const appKey = script.getAttribute('data-application-key');
      if (appKey) {
        return appKey;
      }
    }
  }
  
  // Fallback: try to find by checking current script execution
  // This works by checking the last script tag (likely the one executing)
  if (scripts.length > 0) {
    const lastScript = scripts[scripts.length - 1];
    const appKey = lastScript.getAttribute('data-application-key');
    if (appKey) {
      return appKey;
    }
  }
  
  return null;
}

