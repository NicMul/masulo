export function setupImageFade(imgElement) {
  if (!imgElement) return;
  imgElement.classList.add('mesulo-image-fade');
}


export function setupVideoFade(videoContainer) {
  if (!videoContainer) return;
  videoContainer.classList.add('mesulo-video-fade');
}


export function startFadeTransition(imgElement, videoContainer, onComplete) {
  if (!imgElement || !videoContainer) return;


  videoContainer.classList.add('active');


  imgElement.style.opacity = '0';


  if (onComplete) {
    setTimeout(() => {
      onComplete();
    }, 600);
  }
}

