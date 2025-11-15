import { h } from 'preact';


export function VideoUpdateSpinner({ className = '' }) {
  const classes = ['mesulo-spinner', 'mesulo-video-update-spinner', className].filter(Boolean).join(' ');
  return h('div', {
    className: classes
  });
}

