import { signal } from '@preact/signals';

const gameVideos = signal(new Map());

export const gameVideoStore = {
  getVideoState(gameId) {
    return gameVideos.value.get(gameId) || null;
  },

  setVideoState(gameId, state) {
    const newMap = new Map(gameVideos.value);
    newMap.set(gameId, {
      id: gameId,
      videoRef: state.videoRef,
      poster: state.poster || null,
      src: state.src || null,
      version: state.version || '0',
      loading: state.loading !== undefined ? state.loading : false,
      type: state.type || 'default',
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

