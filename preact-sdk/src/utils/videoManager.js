let activeVideo = null;

export function pauseAllVideos(exceptVideo = null) {
  const allVideos = document.querySelectorAll('video[data-mesulo-id]');
  allVideos.forEach(video => {
    if (video !== exceptVideo && !video.paused) {
      video.pause();
    }
  });
}

export function setActiveVideo(videoElement) {
  if (activeVideo && activeVideo !== videoElement && !activeVideo.paused) {
    activeVideo.pause();
  }
  activeVideo = videoElement;
}

export function getActiveVideo() {
  return activeVideo;
}

export function clearActiveVideo() {
  if (activeVideo) {
    activeVideo.pause();
    activeVideo = null;
  }
}

export function pauseActiveVideo() {
  if (activeVideo && !activeVideo.paused) {
    activeVideo.pause();
  }
}

