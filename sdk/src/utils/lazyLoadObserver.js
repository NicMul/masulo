const observers = new WeakMap();
let lazyLoadObserver = null;

function getLazyLoadObserver() {
    if (!lazyLoadObserver) {
        lazyLoadObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const target = entry.target;
                const src = observers.get(target);

                if (!src) return;

                if (entry.isIntersecting) {
                    if (target.src !== src) {
                        target.src = src;
                    }
                } else {
                    if (target.src) {
                        target.removeAttribute('src');
                        target.load();
                    }
                }
            });
        }, {
            rootMargin: '100% 0px 100% 0px',
            threshold: 0
        });
    }
    return lazyLoadObserver;
}

export function observeVideo(videoEl, srcData) {
    if (!videoEl || !srcData) return;

    // Store the desired src URL for this video element
    observers.set(videoEl, srcData);

    // Setup observer
    const observer = getLazyLoadObserver();
    observer.observe(videoEl);
}

export function unobserveVideo(videoEl) {
    if (!videoEl) return;

    const observer = getLazyLoadObserver();
    observer.unobserve(videoEl);
    observers.delete(videoEl);

    if (videoEl.src) {
        videoEl.removeAttribute('src');
        videoEl.load();
    }
}
