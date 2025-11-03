/***
*
*   PROMO ASSETS COMPONENT
*   Displays promotional AI-generated content with controls
*
**********/

import { useState, useCallback, useContext } from 'react';
import { Card, Button } from 'components/lib';
import { ViewContext } from 'components/lib';
import { GameEditActionMenu } from './GameEditActionMenu';
import MediaPlayer from './MediaPlayer';
import { GenerateAssets } from './GenerateAssets';

export function PromoAssets({ t, selectedGame, onGameUpdate, onPublish }) {
  const viewContext = useContext(ViewContext);
  const [promoLocked, setPromoLocked] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  // regenerate promo assets
  const regeneratePromoAssets = useCallback(() => {
    if (!selectedGame) {
      viewContext.notification({
        description: t('edit.regenerate.noGame'),
        variant: 'error'
      });
      return;
    }

    setShowRegenerateDialog(true);
  }, [selectedGame, t, viewContext]);

  // clear promo content
  const clearPromoContent = useCallback(() => {
    if (!selectedGame) {
      viewContext.notification({
        description: t('edit.clear.noGame'),
        variant: 'error'
      });
      return;
    }

    viewContext.notification({
      description: t('edit.clear.promo.success'),
      variant: 'success'
    });
  }, [selectedGame, t, viewContext]);

  const handleSelect = (videoUrl) => {
    console.log('Selected video:', videoUrl);
  };

  return (
    <Card 
      title={ t('edit.promo.title') }
      headerAction={
        <GameEditActionMenu 
          selectedGame={selectedGame}
          locked={promoLocked}
          onRegenerate={regeneratePromoAssets}
          onLock={() => setPromoLocked(!promoLocked)}
          onDelete={clearPromoContent}
          onSave={onPublish}
          assetType="promo"
        />
      }
    >
      <div className='space-y-4'>
        {/* Image and Video Row */}
        <div className='grid grid-cols-2 gap-3'>
          {/* Image */}
          <div className='bg-green-100 dark:bg-green-900 rounded-lg p-3 text-center'>
            <div className='text-xs font-bold text-green-800 dark:text-green-200 mb-2'>
              { t('edit.promo.image') }
            </div>
           
            <MediaPlayer
              gameId={selectedGame?.id}
              imageUrl={selectedGame?.promoImage}
              videoUrl={selectedGame?.promoVideo}
              onSelect={handleSelect}
              type="image"
              canSelect={false}
              showPlayIcon={false}
              readOnly={false}
            />
         
          </div>
          
          {/* Video */}
          <div className='bg-green-100 dark:bg-green-900 rounded-lg p-3 text-center'>
            <div className='text-xs font-bold text-green-800 dark:text-green-200 mb-2'>
              { t('edit.promo.video') }
            </div>
            <MediaPlayer
              gameId={selectedGame?.id}
              imageUrl={selectedGame?.promoImage}
              videoUrl={selectedGame?.promoVideo}
              onSelect={handleSelect}
              type="video"
              canSelect={false}
            />
          </div>
        </div>
        
        <div className='space-y-2 flex justify-center items-center'>
          <Button 
            icon='refresh-cw' 
            text={ t('edit.promo.regenerate') } 
            onClick={ regeneratePromoAssets }
            disabled={ promoLocked || !selectedGame }
            className="w-3/5"
            color='blue'
          />
        </div>
      </div>
      
      <GenerateAssets
        isOpen={showRegenerateDialog}
        onClose={() => setShowRegenerateDialog(false)}
        selectedGame={selectedGame}
        assetType="promo"
        onGameUpdate={onGameUpdate}
      />
    </Card>
  );
}

