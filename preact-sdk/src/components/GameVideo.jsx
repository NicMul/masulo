import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import "preact/debug";
import { gameVideoStore } from '../store/gameVideoStore.js';

export function GameVideo({ gameId, className, style, onVideoReady }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      const state = gameVideoStore.getVideoState(gameId);
      
      if (state) {
        if (state.poster && !videoRef.current.poster) {
          videoRef.current.poster = state.poster;
        }
        
        if (state.version) {
          videoRef.current.setAttribute('data-mesulo-version', state.version);
        }
      }

      if (onVideoReady) {
        onVideoReady(videoRef.current);
      }

      gameVideoStore.updateVideoState(gameId, {
        videoRef: videoRef.current
      });
    }
  }, [gameId, onVideoReady]);


  const styleObj = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  };

  if (style) {
    if (typeof style === 'string') {
      // Parse style string
      const stylePairs = style.split(';').filter(s => s.trim());
      stylePairs.forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
          const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          styleObj[camelKey] = value;
        }
      });
    } else if (typeof style === 'object') {
      // Style is already an object, merge it
      Object.assign(styleObj, style);
    }
  }

  const state = gameVideoStore.getVideoState(gameId);
  const poster = state?.poster || '';
  const version = state?.version || '0';

  return h('video', {
    ref: videoRef,
    'data-mesulo-game-id': gameId,
    className: className || '',
    'data-mesulo-version': version,
    style: styleObj,
    muted: true,
    poster: poster,
    autoplay: false,
    loop: true,
    preload: 'metadata',
    onClick: (e) => {
      console.log('video clicked');
      if (videoRef.current) {
        videoRef.current.play();
      }
    },
    playsInline: true,
    src: null
  });
}

