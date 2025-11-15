import { signal } from '@preact/signals';

export const gameVideos = signal(new Map());

export const gameVideoStore = {
  getVideoState(gameId) {
    return gameVideos.value.get(gameId);
  },

  setVideoState(gameId, state) {
    const newMap = new Map(gameVideos.value);
    const currentState = gameVideos.value.get(gameId);
    
    // Preserve baseImageSrc once set - never allow it to be overridden
    const preservedBaseImageSrc = currentState?.baseImageSrc || state.baseImageSrc || null;
    
    newMap.set(gameId, {
      id: gameId,
      videoRef: state.videoRef,
      wrapperRef: state.wrapperRef || null,
      baseImageSrc: preservedBaseImageSrc,  // Always preserve existing baseImageSrc
      poster: state.poster || null,
      src: state.src || null,
      version: state.version || '0',
      published: state.published !== undefined ? state.published : true,
      loading: state.loading !== undefined ? state.loading : false,
      isInitialLoad: state.isInitialLoad !== undefined ? state.isInitialLoad : true,
      animate: state.animate !== undefined ? state.animate : true,
      hover: state.hover !== undefined ? state.hover : true,
      type: state.type || 'default',
      ...state,
      baseImageSrc: preservedBaseImageSrc  // Override again to ensure it's never lost
    });
    gameVideos.value = newMap;
  },

  updateVideoState(gameId, updates) {
    const current = gameVideos.value.get(gameId);
    if (current) {
      gameVideoStore.setVideoState(gameId, { ...current, ...updates });
    }
  },

  getAllVideos() {
    return Array.from(gameVideos.value.values());
  },

  isProcessed(gameId) {
    return gameVideos.value.has(gameId);
  }
};

