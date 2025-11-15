import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import "preact/debug";
import { gameVideoStore, gameVideos } from '../store/gameVideoStore.js';
import { VideoUpdateSpinner } from './VideoUpdateSpinner.jsx';
import { injectUpdateSpinnerStyles } from '../utils/updateSpinnerStyles.js';

export function GameVideo({ gameId, className, style, poster = '', version = '0', wrapperClassName = '', onVideoReady }) {
  const videoRef = useRef(null);
  
  // Access signal directly for reactivity - this will trigger re-renders when signal changes
  const state = gameVideos.value.get(gameId);
  const isLoading = state?.loading || false;

  useEffect(() => {
    injectUpdateSpinnerStyles();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      const existingState = gameVideoStore.getVideoState(gameId);
      
      if (!existingState) {
        gameVideoStore.setVideoState(gameId, {
          id: gameId,
          videoRef: videoRef.current, 
          poster,
          src: null,
          version,
          loading: false, 
        });
      } else {
        gameVideoStore.updateVideoState(gameId, {
          videoRef: videoRef.current
        });
      }

      if (poster && !videoRef.current.poster) {
        videoRef.current.poster = poster;
      }
      
      if (version) {
        videoRef.current.setAttribute('data-mesulo-version', version);
      }

      if (onVideoReady) {
        onVideoReady(videoRef.current);
      }
    }
  }, [gameId, poster, version, onVideoReady]);

  // Update video element when state changes reactively
  useEffect(() => {
    if (videoRef.current && state) {
      if (state.src && videoRef.current.src !== state.src) {
        videoRef.current.src = state.src;
      }
      if (state.poster && videoRef.current.poster !== state.poster) {
        videoRef.current.poster = state.poster;
      }
    }
  }, [state]);

  const styleObj = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  };

  if (style) {
    if (typeof style === 'string') {
      const stylePairs = style.split(';').filter(s => s.trim());
      stylePairs.forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
          const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          styleObj[camelKey] = value;
        }
      });
    } else if (typeof style === 'object') {
      Object.assign(styleObj, style);
    }
  }

  const wrapperStyle = {
    position: 'relative',
    width: '100%',
    height: '100%'
  };

  if (wrapperClassName.includes('mesulo-video-fade')) {
    wrapperStyle.position = 'absolute';
    wrapperStyle.top = '0';
    wrapperStyle.left = '0';
    wrapperStyle.zIndex = '2';
    wrapperStyle.opacity = '0';
  }

  return h('div', {
    className: wrapperClassName,
    style: wrapperStyle
  }, [
    h('video', {
      ref: videoRef,
      'data-mesulo-id': gameId,
      className: className || '',
      'data-mesulo-version': version,
      style: styleObj,
      muted: true,
      poster: state?.poster || poster,
      autoplay: false,
      loop: true,
      preload: 'metadata',
      onClick: (e) => {
        if (videoRef.current) {
          videoRef.current.play();
        }
      },
      playsInline: true,
      src: state?.src || null
    }),
    h(VideoUpdateSpinner, {
      className: isLoading ? 'visible' : ''
    })
  ]);
}

