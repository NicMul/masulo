// Utility functions for GenerateAssets component

/**
 * Returns appropriate button text based on generation state
 * @param {boolean} isGenerating - Whether assets are currently being generated
 * @param {Function} t - Translation function
 * @returns {string} Button text
 */
export const getButtonText = (isGenerating, t) => {
    if (isGenerating) return t('edit.regenerate.dialog.generating');
    return t('edit.regenerate.dialog.generateAssets');
};

/**
 * Determines media player type based on image/video availability
 * @param {Object} selectedGame - The selected game object
 * @param {string|null} testImage - Test image URL
 * @param {string|null} testVideoUrl - Test video URL
 * @returns {string} Media player type ('both', 'image', 'video')
 */
export const getMediaPlayerType = (selectedGame, testImage, testVideoUrl) => {
    const hasImage = selectedGame?.testImage || testImage;
    const hasVideo = selectedGame?.testVideo || testVideoUrl;
    if (hasImage && hasVideo) return 'both';
    if (hasImage) return 'image';
    if (hasVideo) return 'video';
    return 'both';
};

/**
 * Gets image URL based on asset type
 * @param {string} assetType - Type of asset ('original', 'current', 'theme', 'promo')
 * @param {Object} selectedGame - The selected game object
 * @returns {string|null} Image URL
 */
export const getImageUrl = (assetType, selectedGame) => {
    if (assetType === 'original') return selectedGame?.defaultImage;
    if (assetType === 'current') return selectedGame?.currentImage;
    if (assetType === 'theme') return selectedGame?.themeImage;
    if (assetType === 'promo') return selectedGame?.promoImage;
    return null;
};

/**
 * Gets video URL based on asset type
 * @param {string} assetType - Type of asset ('original', 'current', 'theme', 'promo')
 * @param {Object} selectedGame - The selected game object
 * @returns {string|null} Video URL
 */
export const getVideoUrl = (assetType, selectedGame) => {
    if (assetType === 'original') return selectedGame?.defaultVideo;
    if (assetType === 'current') return selectedGame?.currentVideo;
    if (assetType === 'theme') return selectedGame?.themeVideo;
    if (assetType === 'promo') return selectedGame?.promoVideo;
    return null;
};

/**
 * Gets test video URL with fallback to selected game test video
 * @param {string|null} testVideoUrl - Test video URL
 * @param {Object} selectedGame - The selected game object
 * @returns {string|null} Test video URL
 */
export const getTestVideoUrl = (testVideoUrl, selectedGame) => {
    if (testVideoUrl) {
        return testVideoUrl;
    }
    return selectedGame?.testVideo;
};

/**
 * Returns placeholder text for description based on asset type
 * @param {string} assetType - Type of asset ('original', 'current', 'theme')
 * @param {Function} t - Translation function
 * @returns {string} Placeholder text
 */
export const generateDescriptionPlaceholder = (assetType, t) => {
    if (assetType === 'original') {
        return t('edit.regenerate.dialog.placeholders.originalImagePrompt');
    }
    return t('edit.regenerate.dialog.placeholders.aiGeneratedImagePrompt');
};
