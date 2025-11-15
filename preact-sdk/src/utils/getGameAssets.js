/**
 * Get the appropriate image and video URLs based on publishedType
 * @param {Object} game - Game object from socket response
 * @returns {Object} - { imageUrl, videoUrl }
 */
export function getGameAssets(game) {
  if (!game.published) {
    return {
      imageUrl: game.defaultImage || '',
      videoUrl: game.defaultVideo || ''
    };
  }

  switch (game.publishedType) {
    case 'current':
      return {
        imageUrl: game.currentImage || game.defaultImage || '',
        videoUrl: game.currentVideo || game.defaultVideo || ''
      };
    
    case 'theme':
      return {
        imageUrl: game.themeImage || game.defaultImage || '',
        videoUrl: game.themeVideo || game.defaultVideo || ''
      };
    
    case 'promo':
      return {
        imageUrl: game.promoImage || game.defaultImage || '',
        videoUrl: game.promoVideo || game.defaultVideo || ''
      };
    
    case 'default':
    default:
      return {
        imageUrl: game.defaultImage || '',
        videoUrl: game.defaultVideo || ''
      };
  }
}

