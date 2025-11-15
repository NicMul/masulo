import { setActiveVideo, pauseActiveVideo } from './videoManager.js';

export function detectInteractiveElement(element) {
  if (!element) return null;
  
 
  const interactive = element.closest('a, button, input, select, textarea, [role="button"]');
  return interactive;
}


export function getButtonType(element) {
  if (!element) return 'unknown';
  
  const tagName = element.tagName?.toLowerCase();
  

  if (tagName === 'a') {
  
    const href = element.getAttribute('href');
    if (href && href !== '#' && !href.startsWith('#')) {
      return 'link';
    }
    return 'anchor';
  }
  
  if (tagName === 'button') {
    const type = element.getAttribute('type')?.toLowerCase();
    if (type === 'submit') return 'submit';
    if (type === 'reset') return 'reset';
    return 'button';
  }
  
  if (tagName === 'input') {
    const type = element.getAttribute('type')?.toLowerCase();
    return `input-${type || 'text'}`;
  }
  
  if (tagName === 'select') return 'select';
  if (tagName === 'textarea') return 'textarea';
  

  const role = element.getAttribute('role');
  if (role === 'button') return 'role-button';
  

  return 'interactive';
}

export function handleHover(gameId, containerElement, isEntering, event, videoElement, onHover) {

  if (onHover) {
    onHover(gameId, containerElement, isEntering, event);
  }
  
  // Auto-control video
  if (videoElement) {
    if (isEntering) {
      setActiveVideo(videoElement);
      videoElement.play().catch(() => {
     
      });
    } else {
      videoElement.pause();
    }
  }
}

export function handleClick(gameId, containerElement, event, videoElement, onClick) {

  if (onClick) {
    onClick(gameId, containerElement, event);
  }
  

  if (videoElement) {
    if (videoElement.paused) {
      setActiveVideo(videoElement);
      videoElement.play().catch(() => {});
    } else {
      videoElement.pause();
    }
  }
}


export function handleButtonClick(gameId, containerElement, interactiveElement, event, videoElement, onButtonClick) {
  const buttonType = getButtonType(interactiveElement);
  

  if (onButtonClick) {
    onButtonClick(gameId, containerElement, buttonType, event);
  }
  

  if (videoElement) {
    videoElement.pause();
  }
}

