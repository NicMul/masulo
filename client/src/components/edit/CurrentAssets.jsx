/***
*
*   CURRENT ASSETS COMPONENT
*   Displays current AI-generated content with controls
*
**********/

import { useState, useCallback, useContext, useMemo } from 'react';
import { Card, Button, Switch } from 'components/lib';
import { ViewContext } from 'components/lib';
import { GameEditActionMenu } from './GameEditActionMenu';
import  MediaPlayer from './MediaPlayer';
import { GenerateAssets } from './GenerateAssets';

export function CurrentAssets({ t, selectedGame, onGameUpdate }) {
  const viewContext = useContext(ViewContext);
  const [currentLocked, setCurrentLocked] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  // regenerate current assets
  const regenerateCurrentAssets = useCallback(() => {
    if (!selectedGame) {
      viewContext.notification({
        description: t('edit.regenerate.noGame'),
        variant: 'error'
      });
      return;
    }

    setShowRegenerateDialog(true);
  }, [selectedGame, t, viewContext]);

  // clear theme content
  const clearThemeContent = useCallback(() => {
    if (!selectedGame) {
      viewContext.notification({
        description: t('edit.clear.noGame'),
        variant: 'error'
      });
      return;
    }

    viewContext.notification({
      description: t('edit.clear.theme.success'),
      variant: 'success'
    });
  }, [selectedGame, t, viewContext]);

  const handleSelect = (videoUrl) => {
    console.log('Selected video:', videoUrl);
  };

  return (
    <Card 
      title={ t('edit.current.title') }
      headerAction={
        <GameEditActionMenu 
          selectedGame={selectedGame}
          locked={currentLocked}
          onRegenerate={regenerateCurrentAssets}
          onLock={() => setCurrentLocked(!currentLocked)}
          onDelete={clearThemeContent}
          onSave={() => console.log('Save current assets')}
        />
      }
    >
      <div className='space-y-4'>
        {/* Image and Video Row */}
        <div className='grid grid-cols-2 gap-3'>
          {/* Image */}
          <div className='bg-purple-100 dark:bg-purple-900 rounded-lg p-3 text-center'>
            <div className='text-xs font-bold text-purple-800 dark:text-purple-200 mb-2'>
              { t('edit.current.image') }
            </div>
           
            <MediaPlayer
              gameId={selectedGame?.id}
              imageUrl={selectedGame?.currentImage}
              videoUrl={selectedGame?.currentVideo}
              onSelect={handleSelect}
              type="image"
              canSelect={false}
              showPlayIcon={false}
              readOnly={false}
            />
         
          </div>
          
          {/* Video */}
          <div className='bg-purple-100 dark:bg-purple-900 rounded-lg p-3 text-center'>
            <div className='text-xs font-bold text-purple-800 dark:text-purple-200 mb-2'>
              { t('edit.current.video') }
            </div>
            <MediaPlayer
              gameId={selectedGame?.id}
              imageUrl={selectedGame?.currentImage}
              videoUrl={selectedGame?.currentVideo}
              onSelect={handleSelect}
              type="video"
              canSelect={false}
            />
          </div>
        </div>
        
        <div className='space-y-2 flex justify-center items-center'>
          <Button 
            icon='refresh-cw' 
            text={ t('edit.current.regenerate') } 
            onClick={ regenerateCurrentAssets }
            disabled={ currentLocked || !selectedGame }
            className="w-3/5"
            color='blue'
          />
        </div>
      </div>
      
      <GenerateAssets
        isOpen={showRegenerateDialog}
        onClose={() => setShowRegenerateDialog(false)}
        selectedGame={selectedGame}
        assetType="current"
        onGameUpdate={onGameUpdate}
      />
    </Card>
  );
}
