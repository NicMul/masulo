/***
*
*   MEDIA VIEWER COMPONENT
*   Displays images/videos with click-to-open dialog functionality
*
**********/

import { useCallback } from 'react';

export function MediaViewer({ mediaUrl, mediaType, title, alt, className, controls = false }) {
  // open media dialog
  const openMediaDialog = useCallback((url, type, title) => {
    if (!url) return;
    
    // Create a simple dialog with just the media
    const dialogElement = document.createElement('div');
    dialogElement.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    dialogElement.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-4xl max-h-4xl mx-4 relative">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">${title}</h3>
          <button class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" onclick="this.closest('.fixed').remove()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="text-center">
          ${type === 'image' 
            ? `<img src="${url}" alt="${title}"  w-auto mx-auto rounded-lg" />`
            : `<video src="${url}" controls  w-auto mx-auto rounded-lg" />`
          }
        </div>
      </div>
    `;
    
    // Add click outside to close
    dialogElement.addEventListener('click', (e) => {
      if (e.target === dialogElement) {
        dialogElement.remove();
      }
    });
    
    document.body.appendChild(dialogElement);
  }, []);

  const handleError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextSibling) {
      e.target.nextSibling.style.display = 'block';
    }
  };

  if (!mediaUrl) {
    return null;
  }

  if (mediaType === 'image') {
    return (
      <>
        <img 
          src={mediaUrl} 
          alt={alt || title}
          className={className}
          onClick={() => openMediaDialog(mediaUrl, mediaType, title)}
          onError={handleError}
        />
        <div className='text-xs text-slate-600 dark:text-slate-400' style={{ display: 'none' }}>
          {title}
        </div>
      </>
    );
  }

  return (
    <>
      <video 
        src={mediaUrl} 
        className={className}
        controls={controls}
        onClick={() => openMediaDialog(mediaUrl, mediaType, title)}
        onError={handleError}
      />
      <div className='text-xs text-slate-600 dark:text-slate-400' style={{ display: 'none' }}>
        {title}
      </div>
    </>
  );
}
