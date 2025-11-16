import { promotionsStore } from '../store/promotionsStore.js';

export function getGameAssets(game) {
  if (!game.published) {
    return {
      imageUrl: game.defaultImage || '',
      videoUrl: null
    };
  }

  const promotionAssets = promotionsStore.getPromotionsForGame(game.id);
  if (promotionAssets && (promotionAssets.promoImage || promotionAssets.promoVideo)) {
    return {
      imageUrl: promotionAssets.promoImage || game.defaultImage || '',
      videoUrl: promotionAssets.promoVideo || null
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

