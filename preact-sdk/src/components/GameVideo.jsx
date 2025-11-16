import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import "preact/debug";
import { gameVideoStore, gameVideos } from '../store/gameVideoStore.js';
import { VideoUpdateSpinner } from './VideoUpdateSpinner.jsx';
import { injectUpdateSpinnerStyles } from '../utils/updateSpinnerStyles.js';
import { injectWrapperStyles } from '../utils/wrapperStyles.js';

export function GameVideo({ gameId, className, style, poster = '', version = '0', wrapperClassName = '', onVideoReady }) {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  
  const state = gameVideos.value.get(gameId);
  const isLoading = state?.loading || false;
  
  // Base image logic:
  // - During initial load: Lock to original website image (baseImageSrc)
  // - After initial load: Allow updates to new poster for smooth transitions
  const baseImageSrc = state?.isInitialLoad === false 
    ? (state?.poster || poster)  // Allow updates after initial load
    : ((state?.baseImageSrc && state.baseImageSrc !== '') ? state.baseImageSrc : poster);  // Lock during initial load

  useEffect(() => {
    injectUpdateSpinnerStyles();
    injectWrapperStyles();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      const existingState = gameVideoStore.getVideoState(gameId);
      
      if (!existingState) {
        gameVideoStore.setVideoState(gameId, {
          id: gameId,
          videoRef: videoRef.current,
          wrapperRef: wrapperRef.current,
          poster,
          src: null,
          version,
          loading: false,
        });
      } else {
        gameVideoStore.updateVideoState(gameId, {
          videoRef: videoRef.current,
          wrapperRef: wrapperRef.current
        });
      }

      // NOTE: Poster is set declaratively in the render to baseImageSrc
      
      if (version) {
        videoRef.current.setAttribute('data-mesulo-version', version);
      }

      if (onVideoReady) {
        onVideoReady(videoRef.current);
      }
    }
  }, [gameId, poster, version, onVideoReady]);

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
    const wrapperEl = videoEl.closest('.mesulo-video-wrapper');
    if (!wrapperEl) return;
    
    // Determine playback mode
    const isAutoplayMode = state.hover === false && state.animate !== false;
    const isHoverMode = state.hover !== false && state.animate !== false;
    const isPosterOnly = state.animate === false;
    
    // ALWAYS attach event listeners on wrapper (for tracking/analytics)
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
    wrapperEl.addEventListener('mouseenter', handleMouseEnter);
    wrapperEl.addEventListener('mouseleave', handleMouseLeave);
    wrapperEl.addEventListener('touchstart', handleTouchStart);
    wrapperEl.addEventListener('touchend', handleTouchEnd);
    
    // Handle autoplay mode
    if (isAutoplayMode && videoEl.src) {
      videoEl.autoplay = true;
      const playWhenReady = () => {
        videoEl.play().catch(() => {});
      };
      videoEl.addEventListener('loadeddata', playWhenReady);
      
      return () => {
        wrapperEl.removeEventListener('mouseenter', handleMouseEnter);
        wrapperEl.removeEventListener('mouseleave', handleMouseLeave);
        wrapperEl.removeEventListener('touchstart', handleTouchStart);
        wrapperEl.removeEventListener('touchend', handleTouchEnd);
        videoEl.removeEventListener('loadeddata', playWhenReady);
      };
    }
    
    // Cleanup for hover/poster modes
    return () => {
      wrapperEl.removeEventListener('mouseenter', handleMouseEnter);
      wrapperEl.removeEventListener('mouseleave', handleMouseLeave);
      wrapperEl.removeEventListener('touchstart', handleTouchStart);
      wrapperEl.removeEventListener('touchend', handleTouchEnd);
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

  return h('div', {
    ref: wrapperRef,
    className: 'mesulo-video-wrapper',
    style: styleObj
  }, [
    // Base image - provides backdrop during transitions
    h('img', {
      className: 'mesulo-base-image',
      src: baseImageSrc,
      alt: ''
    }),
    
    // Video element
    h('video', {
      ref: videoRef,
      'data-mesulo-id': gameId,
      'data-mesulo-version': version,
      muted: true,
      className: state?.src && !isLoading ? 'mesulo-video-visible' : '',
      poster: state.poster || poster,  // Use same as base-image to avoid flicker
      autoplay: state?.hover === false,  // Autoplay if hover is false
      loop: true,
      preload: 'metadata',
      playsInline: true,
      src: state?.src || null
    }),
    
    // Spinner - always mounted, controlled by isLoading
    h(VideoUpdateSpinner, { 
      className: isLoading ? 'visible' : '' 
    })
  ]);
}

