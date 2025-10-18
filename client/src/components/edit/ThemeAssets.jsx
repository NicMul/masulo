/***
*
*   THEME ASSETS COMPONENT
*   Displays theme AI-generated content with controls
*
**********/

import { useState, useCallback, useContext } from 'react';
import { Card, Button, Switch } from 'components/lib';
import { ViewContext } from 'components/lib';
import { MediaViewer } from './MediaViewer';

export function ThemeAssets({ t, selectedGame }) {
  const viewContext = useContext(ViewContext);
  const [themeLocked, setThemeLocked] = useState(false);

  // regenerate theme assets
  const regenerateThemeAssets = useCallback(() => {
    if (!selectedGame) {
      viewContext.notification({
        description: t('edit.regenerate.noGame'),
        variant: 'error'
      });
      return;
    }

    viewContext.notification({
      description: t('edit.regenerate.theme.success'),
      variant: 'success'
    });
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

  return (
    <Card title={ t('edit.theme.title') }>
      <div className='space-y-4'>
        {/* Image and Video Row */}
        <div className='grid grid-cols-2 gap-3'>
          {/* Image */}
          <div className='bg-orange-100 dark:bg-orange-900 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg p-3 text-center'>
            <div className='text-xs font-bold text-orange-800 dark:text-orange-200 mb-2'>
              { t('edit.theme.image') }
            </div>
            { selectedGame?.themeImage ? (
              <MediaViewer
                mediaUrl={selectedGame.themeImage}
                mediaType="image"
                title={t('edit.theme.image')}
                alt="Theme AI Image"
                className='w-full aspect-[180/280] object-cover rounded mb-2 cursor-pointer hover:opacity-90 transition-opacity'
              />
            ) : (
              <div className='text-xs text-orange-600 dark:text-orange-400'>
                { t('edit.theme.themeImage') }
              </div>
            )}
          </div>
          
          {/* Video */}
          <div className='bg-orange-100 dark:bg-orange-900 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg p-3 text-center'>
            <div className='text-xs font-bold text-orange-800 dark:text-orange-200 mb-2'>
              { t('edit.theme.video') }
            </div>
            { selectedGame?.themeVideo ? (
              <MediaViewer
                mediaUrl={selectedGame.themeVideo}
                mediaType="video"
                title={t('edit.theme.video')}
                alt="Theme AI Video"
                className='w-full aspect-[180/280] object-cover rounded mb-2 cursor-pointer hover:opacity-90 transition-opacity'
                controls={true}
              />
            ) : (
              <div className='text-xs text-orange-600 dark:text-orange-400'>
                { t('edit.theme.themeVideo') }
              </div>
            )}
          </div>
        </div>
        
        <div className='space-y-2'>
          <Button 
            icon='refresh-cw' 
            text={ t('edit.theme.regenerate') } 
            onClick={ regenerateThemeAssets }
            disabled={ themeLocked || !selectedGame }
            className='w-full'
          />
          <div className='flex items-center justify-between'>
            <span className='text-sm text-slate-600 dark:text-slate-400'>
              { t('edit.theme.lock') }
            </span>
            <Switch
              name="themeLock"
              value={ themeLocked }
              onChange={ (e) => setThemeLocked(e.target.value) }
              disabled={ !selectedGame }
            />
          </div>
          <Button 
            icon='trash-2' 
            text={ t('edit.theme.clear') } 
            onClick={ clearThemeContent }
            variant='outline'
            disabled={ !selectedGame }
            className='w-full'
          />
        </div>
      </div>
    </Card>
  );
}
