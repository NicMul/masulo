import { h, Fragment } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import "preact/debug";
import { gameVideoStore, gameVideos } from '../store/gameVideoStore.js';
import { injectWrapperStyles } from '../utils/wrapperStyles.js';

export function GameVideo({ gameId, className, style, poster = '', defaultImage = '', version = '0', wrapperClassName = '', onVideoReady }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const spinnerRef = useRef(null);
  
  const state = gameVideos.value.get(gameId);
  
  useEffect(() => {
    injectWrapperStyles();
  }, []);

  useEffect(() => {
    if (videoRef.current && containerRef.current && spinnerRef.current) {
      const existingState = gameVideoStore.getVideoState(gameId);
      
      if (!existingState) {
        gameVideoStore.setVideoState(gameId, {
          id: gameId,
          videoRef: videoRef.current,
          containerRef: containerRef.current,
          spinnerRef: spinnerRef.current,
          poster,
          defaultImage,
          src: null,
          version,
          loading: false,
        });
      } else {
        gameVideoStore.updateVideoState(gameId, {
          videoRef: videoRef.current,
          containerRef: containerRef.current,
          spinnerRef: spinnerRef.current
        });
      }
      
      if (version) {
        videoRef.current.setAttribute('data-mesulo-version', version);
      }

      if (onVideoReady) {
        onVideoReady(videoRef.current);
      }
    }
  }, [gameId, poster, defaultImage, version, onVideoReady]);

  // NOTE: Video src updates are now orchestrated by lifecycle hooks
  // This prevents conflicts with transition animations
  // Direct reactive updates are disabled to maintain smooth transitions

  // Enforce video state based on game configuration
  useEffect(() => {
    if (!videoRef.current || !state) return;
    
    const videoEl = videoRef.current;
    const isAutoplayMode = state.hover === false && state.animate !== false;
    const isPosterOnly = state.animate === false;
    
    // Autoplay mode: force play if paused
    const handlePause = () => {
      if (isAutoplayMode && videoEl.src) {
        videoEl.play().catch(() => {});
      }
    };
    
    // Poster-only mode: force pause if playing
    const handlePlay = () => {
      if (isPosterOnly) {
        videoEl.pause();
      }
    };
    
    videoEl.addEventListener('pause', handlePause);
    videoEl.addEventListener('play', handlePlay);
    
    return () => {
      videoEl.removeEventListener('pause', handlePause);
      videoEl.removeEventListener('play', handlePlay);
    };
  }, [state?.hover, state?.animate, state?.src]);

  // Playback control based on hover and animate flags
  useEffect(() => {
    if (!videoRef.current || !state) return;
    
    const videoEl = videoRef.current;
    const parentEl = videoEl.parentElement;
    if (!parentEl) return;
    
    // Determine playback mode
    const isAutoplayMode = state.hover === false && state.animate !== false;
    const isHoverMode = state.hover !== false && state.animate !== false;
    const isPosterOnly = state.animate === false;
    
    // ALWAYS attach event listeners on parent element (for tracking/analytics)
    const handleMouseEnter = () => {
      // Only act on hover mode
      if (isHoverMode && videoEl.src) {
        videoEl.play().catch(() => {});
      }
    };
    
    const handleMouseLeave = () => {
      // Only act on hover mode
      if (isHoverMode && videoEl.src) {
        videoEl.pause();
      }
    };
    
    const handleTouchStart = () => {
      // Only act on hover mode
      if (isHoverMode && videoEl.src) {
        videoEl.play().catch(() => {});
      }
    };
    
    const handleTouchEnd = () => {
      // Only act on hover mode
      if (isHoverMode && videoEl.src) {
        videoEl.pause();
      }
    };
    
    // Always attach listeners regardless of mode
    parentEl.addEventListener('mouseenter', handleMouseEnter);
    parentEl.addEventListener('mouseleave', handleMouseLeave);
    parentEl.addEventListener('touchstart', handleTouchStart);
    parentEl.addEventListener('touchend', handleTouchEnd);
    
    // Handle autoplay mode
    if (isAutoplayMode && videoEl.src) {
      videoEl.autoplay = true;
      const playWhenReady = () => {
        videoEl.play().catch(() => {});
      };
      videoEl.addEventListener('loadeddata', playWhenReady);
      
      return () => {
        parentEl.removeEventListener('mouseenter', handleMouseEnter);
        parentEl.removeEventListener('mouseleave', handleMouseLeave);
        parentEl.removeEventListener('touchstart', handleTouchStart);
        parentEl.removeEventListener('touchend', handleTouchEnd);
        videoEl.removeEventListener('loadeddata', playWhenReady);
      };
    }
    
    // Cleanup for hover/poster modes
    return () => {
      parentEl.removeEventListener('mouseenter', handleMouseEnter);
      parentEl.removeEventListener('mouseleave', handleMouseLeave);
      parentEl.removeEventListener('touchstart', handleTouchStart);
      parentEl.removeEventListener('touchend', handleTouchEnd);
    };
  }, [state?.hover, state?.animate, state?.src]);

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

  return h(Fragment, {}, [
    // Video element (rendered first)
    h('video', {
      ref: videoRef,
      'data-mesulo-id': gameId,
      'data-mesulo-version': version,
      className: className,
      style: styleObj,
      muted: true,
      poster: state?.poster || poster,
      autoplay: state?.hover === false,
      loop: true,
      preload: 'metadata',
      playsInline: true,
      src: state?.src || null
    }),
    
    // Container with base image and spinner
    h('div', {
      ref: containerRef,
      className: 'mesulo-container'
    }, [
      h('img', {
        className: 'mesulo-base-image',
        src: state?.defaultImage || defaultImage,
        alt: ''
      }),
      h('div', {
        ref: spinnerRef,
        className: 'mesulo-spinner'
      })
    ])
  ]);
}

