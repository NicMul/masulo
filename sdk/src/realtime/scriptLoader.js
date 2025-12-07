export function getApplicationKeyFromScript() {
 
  const scripts = document.getElementsByTagName('script');
  

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    const src = script.getAttribute('src') || '';

    if (script.hasAttribute('data-application-key')) {
      return script.getAttribute('data-application-key');
    }

    if (src.includes('mesulo-preact-sdk')) {
      const appKey = script.getAttribute('data-application-key');
      if (appKey) {
        return appKey;
      }
    }
  }
  
  if (scripts.length > 0) {
    const lastScript = scripts[scripts.length - 1];
    const appKey = lastScript.getAttribute('data-application-key');
    if (appKey) {
      return appKey;
    }
  }
  
  return null;
}

