/***
*
*   STANDARD ASSETS COMPONENT
*   Displays standard AI-generated content with controls
*
**********/

import { useState, useCallback, useContext } from 'react';
import { Card, Button, Switch } from 'components/lib';
import { ViewContext } from 'components/lib';
import { MediaViewer } from './MediaViewer';

export function StandardAssets({ t, selectedGame }) {
  const viewContext = useContext(ViewContext);
  const [standardLocked, setStandardLocked] = useState(false);

  // regenerate standard assets
  const regenerateStandardAssets = useCallback(() => {
    if (!selectedGame) {
      viewContext.notification({
        description: t('edit.regenerate.noGame'),
        variant: 'error'
      });
      return;
    }

    viewContext.notification({
      description: t('edit.regenerate.standard.success'),
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
    <Card title={ t('edit.standard.title') }>
      <div className='space-y-4'>
        {/* Image and Video Row */}
        <div className='grid grid-cols-2 gap-3'>
          {/* Image */}
          <div className='bg-purple-100 dark:bg-purple-900 rounded-lg p-3 text-center'>
            <div className='text-xs font-bold text-purple-800 dark:text-purple-200 mb-2'>
              { t('edit.standard.image') }
            </div>
            { selectedGame?.currentImage ? (
              <MediaViewer
                mediaUrl={selectedGame.currentImage}
                mediaType="image"
                title={t('edit.standard.image')}
                alt="Standard AI Image"
                className='w-full aspect-[180/280] object-cover rounded mb-2 cursor-pointer hover:opacity-90 transition-opacity'
              />
            ) : (
              <div className='text-xs text-purple-600 dark:text-purple-400'>
                { t('edit.standard.aiImage') }
              </div>
            )}
          </div>
          
          {/* Video */}
          <div className='bg-purple-100 dark:bg-purple-900 rounded-lg p-3 text-center'>
            <div className='text-xs font-bold text-purple-800 dark:text-purple-200 mb-2'>
              { t('edit.standard.video') }
            </div>
            { selectedGame?.currentVideo ? (
              <MediaViewer
                mediaUrl={selectedGame.currentVideo}
                mediaType="video"
                title={t('edit.standard.video')}
                alt="Standard AI Video"
                className='w-full aspect-[180/280] object-cover rounded mb-2 cursor-pointer hover:opacity-90 transition-opacity'
                controls={true}
              />
            ) : (
              <div className='text-xs text-purple-600 dark:text-purple-400'>
                { t('edit.standard.aiVideo') }
              </div>
            )}
          </div>
        </div>
        
        <div className='space-y-2'>
          <Button 
            icon='refresh-cw' 
            text={ t('edit.standard.regenerate') } 
            onClick={ regenerateStandardAssets }
            disabled={ standardLocked || !selectedGame }
            className='w-full'
          />
          <div className='flex items-center justify-between'>
            <span className='text-sm text-slate-600 dark:text-slate-400'>
              { t('edit.standard.lock') }
            </span>
            <Switch
              name="standardLock"
              value={ standardLocked }
              onChange={ (e) => setStandardLocked(e.target.value) }
              disabled={ !selectedGame }
            />
          </div>
          <Button 
            icon='trash-2' 
            text={ t('edit.aiStandard.clear') } 
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
