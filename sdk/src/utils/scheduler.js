export function scheduleChunkedTask(items, taskFn, options = {}) {
    const {
        timeout = 1000,
        onComplete = () => { }
    } = options;

    let queue = Array.from(items);

    if (queue.length === 0) {
        onComplete();
        return;
    }

    // Fallback for browsers that don't support requestIdleCallback (like Safari)
    const requestIdle = window.requestIdleCallback || function (cb) {
        const start = Date.now();
        return setTimeout(function () {
            cb({
                didTimeout: false,
                timeRemaining: function () {
                    return Math.max(0, 50 - (Date.now() - start));
                }
            });
        }, 1);
    };

    function processChunk(deadline) {
        // Process items as long as we have time remaining, or if we've timed out
        // Give at least 5ms of breathing room to the browser
        while (queue.length > 0 && (deadline.timeRemaining() > 5 || deadline.didTimeout)) {
            const item = queue.shift();
            try {
                taskFn(item);
            } catch (error) {
                console.error('Mesulo SDK: Error processing chunk item', error);
            }
        }

        if (queue.length > 0) {
            // Schedule the next chunk
            requestIdle(processChunk, { timeout });
        } else {
            // All done
            onComplete();
        }
    }

    // Start the first chunk
    requestIdle(processChunk, { timeout });
}
