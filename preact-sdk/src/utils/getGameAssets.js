import { promotionsStore } from '../store/promotionsStore.js';
import { abtestStore } from '../store/abtestStore.js';

export function getGameAssets(game) {
  const defaultImage = game.defaultImage || '';
  
  if (!game.published) {
    return {
      imageUrl: defaultImage,
      videoUrl: null,
      defaultImage
    };
  }

  const promotionAssets = promotionsStore.getPromotionsForGame(game.id);
  if (promotionAssets && (promotionAssets.promoImage || promotionAssets.promoVideo)) {
    return {
      imageUrl: promotionAssets.promoImage || defaultImage,
      videoUrl: promotionAssets.promoVideo || null,
      defaultImage
    };
  }

  const abtestAssets = abtestStore.getABTestForGame(game.id);
  if (abtestAssets && (abtestAssets.imageUrl || abtestAssets.videoUrl)) {
    return {
      imageUrl: abtestAssets.imageUrl || defaultImage,
      videoUrl: abtestAssets.videoUrl || null,
      defaultImage
    };
  }

  switch (game.publishedType) {
    case 'current':
      return {
        imageUrl: game.currentImage || defaultImage,
        videoUrl: game.currentVideo || game.defaultVideo || '',
        defaultImage
      };
    
    case 'theme':
      return {
        imageUrl: game.themeImage || defaultImage,
        videoUrl: game.themeVideo || game.defaultVideo || '',
        defaultImage
      };
    
    case 'promo':
      return {
        imageUrl: game.promoImage || defaultImage,
        videoUrl: game.promoVideo || game.defaultVideo || '',
        defaultImage
      };
    
    case 'default':
    default:
      return {
        imageUrl: defaultImage,
        videoUrl: game.defaultVideo || '',
        defaultImage
      };
  }
}

