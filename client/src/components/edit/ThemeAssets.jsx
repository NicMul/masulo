/***
*
*   THEME ASSETS COMPONENT
*   Displays theme AI-generated content with controls
*
**********/

import { useState, useCallback, useContext } from 'react';
import { Card, Button, Switch } from 'components/lib';
import { ViewContext } from 'components/lib';
import { RegenerateAiAssetsDialog } from './RegenerateAiAssetsDialog';
import  MediaPlayer from './MediaPlayer';

export function ThemeAssets({ t, selectedGame, onGameUpdate }) {
  const viewContext = useContext(ViewContext);
  const [themeLocked, setThemeLocked] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  // regenerate theme assets
  const regenerateThemeAssets = useCallback(() => {
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
    <Card title={ t('edit.theme.title', { theme: selectedGame?.theme || 'DEFAULT' }) }>
      <div className='space-y-4'>
        {/* Image and Video Row */}
        <div className='grid grid-cols-2 gap-3'>
          {/* Image */}
          <div className='bg-orange-100 dark:bg-orange-900 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg p-3 text-center'>
            <div className='text-xs font-bold text-orange-800 dark:text-orange-200 mb-2'>
              { t('edit.theme.image') }
            </div>
            <MediaPlayer
              gameId={selectedGame?.id}
              imageUrl={selectedGame?.themeImage}
              videoUrl={selectedGame?.themeVideo}
              onSelect={handleSelect}
              type="image"
              canSelect={false}
              showPlayIcon={false}
              readOnly={false}
            />
          </div>
          
          {/* Video */}
          <div className='bg-orange-100 dark:bg-orange-900 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg p-3 text-center'>
            <div className='text-xs font-bold text-orange-800 dark:text-orange-200 mb-2'>
              { t('edit.theme.video') }
            </div>
            <MediaPlayer
              gameId={selectedGame?.id}
              imageUrl={selectedGame?.themeImage}
              videoUrl={selectedGame?.themeVideo}
              onSelect={handleSelect}
              type="video"
              canSelect={false}
              showPlayIcon={true}
              readOnly={false}
            />
          </div>
        </div>
        
        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-2'>
          <Button 
            icon='refresh-cw' 
            text={ t('edit.theme.regenerate') } 
            onClick={ regenerateThemeAssets }
            disabled={ themeLocked || !selectedGame }
            className='w-full'
            color='blue'
          />
          <Button 
            icon='trash-2' 
            text={ t('edit.theme.clear') } 
            onClick={ clearThemeContent }
            color='red'
            disabled={ themeLocked || !selectedGame }
            className='w-full'
          />
          </div>
          
          <div className='flex items-center justify-end'>
            <span className='text-sm text-slate-600 dark:text-slate-400 mr-2'>
              { t('edit.theme.lock') }
            </span>
            <Switch
              name="themeLock"
              value={ themeLocked }
              onChange={ (e) => setThemeLocked(e.target.value) }
              disabled={ !selectedGame }
            />
          </div>
          
        </div>
      </div>
      
      <RegenerateAiAssetsDialog
        isOpen={showRegenerateDialog}
        onClose={() => setShowRegenerateDialog(false)}
        selectedGame={selectedGame}
        assetType="theme"
        onGameUpdate={onGameUpdate}
        t={t}
      />
    </Card>
  );
}
