/***
*
*   CURRENT ASSETS COMPONENT
*   Displays current AI-generated content with controls
*
**********/

import { useState, useCallback, useContext, useMemo } from 'react';
import { Card, Button, Switch } from 'components/lib';
import { ViewContext } from 'components/lib';
import { MediaViewer } from './MediaViewer';
import { RegenerateAiAssetsDialog } from './RegenerateAiAssetsDialog';
import  MediaPlayer from './MediaPlayer';

export function CurrentAssets({ t, selectedGame }) {
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
    <Card title={ t('edit.current.title') }>
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
        
        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-2'>
          <Button 
            icon='refresh-cw' 
            text={ t('edit.current.regenerate') } 
            onClick={ regenerateCurrentAssets }
            disabled={ currentLocked || !selectedGame }
            className='w-full'
            color='blue'
          />
          <Button 
            icon='trash-2' 
            text={ t('edit.current.delete') } 
            onClick={ clearThemeContent }
            color='red'
            disabled={ currentLocked || !selectedGame }
            className='w-full'
          />
          </div>
          
          <div className='flex items-center justify-end'>
            <span className='text-sm text-slate-600 dark:text-slate-400 mr-2'>
              { t('edit.current.lock') }
            </span>
            <Switch
              name="currentLock"
              value={ currentLocked }
              onChange={ (e) => setCurrentLocked(e.target.value) }
              disabled={ !selectedGame }
            />
          </div>
          
        </div>
      </div>
      
      <RegenerateAiAssetsDialog
        isOpen={showRegenerateDialog}
        onClose={setShowRegenerateDialog}
        selectedGame={selectedGame}
        assetType="current"xx
        t={t}
      />
    </Card>
  );
}
