import { signal } from '@preact/signals';

export const gameVideos = signal(new Map());

export const gameVideoStore = {
  getVideoState(gameId) {
    return gameVideos.value.get(gameId);
  },

  setVideoState(gameId, state) {
    const newMap = new Map(gameVideos.value);

    newMap.set(gameId, {
      id: gameId,
      videoRef: state.videoRef,
      containerRef: state.containerRef || null,
      spinnerRef: state.spinnerRef || null,
      defaultImage: state.defaultImage || null,
      poster: state.poster || null,
      src: state.src || null,
      version: state.version || '0',
      published: state.published !== undefined ? state.published : true,
      loading: state.loading !== undefined ? state.loading : false,
      isInitialLoad: state.isInitialLoad !== undefined ? state.isInitialLoad : true,
      animate: state.animate !== undefined ? state.animate : true,
      hover: state.hover !== undefined ? state.hover : true,
      type: state.type || 'default',
      scroll: state.scroll !== undefined ? state.scroll : undefined,
      ...state
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

