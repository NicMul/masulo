

export function isTouchDevice() {
  return (
    ('ontouchstart' in window && navigator.maxTouchPoints > 0) ||
    (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Tablet'))
  );
}
