/***
*
*   ORIGINAL ASSETS COMPONENT
*   Displays original game assets with video regeneration capability
*
**********/

import { useState } from 'react';
import { Card, Button, Switch } from 'components/lib';
import { MediaViewer } from './MediaViewer';
import { RegenerateAiAssetsDialog } from './RegenerateAiAssetsDialog';

export function OriginalAssets({ t, selectedGame }) {
  const [originalLocked, setOriginalLocked] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  const regenerateOriginalVideo = () => {
    setShowRegenerateDialog(true);
  };

  const clearOriginalVideo = () => {
    // TODO: Implement clear original video functionality
    console.log('Clear original video');
  };

  return (
    <Card title={ t('edit.original.title') }>
      <div className='space-y-4'>
        {/* Image and Video Row */}
        <div className='grid grid-cols-2 gap-3'>
          {/* Image - Read Only */}
          <div className='bg-slate-200 dark:bg-slate-700 rounded-lg p-3 text-center'>
            <div className='text-xs font-bold text-slate-800 dark:text-slate-200 mb-2'>
              { t('edit.original.image') }
            </div>
            { selectedGame?.defaultImage ? (
              <MediaViewer
                mediaUrl={selectedGame.defaultImage}
                mediaType="image"
                title={t('edit.original.image')}
                alt="Original Image"
                className='w-full aspect-[180/280] object-cover rounded mb-2 cursor-pointer hover:opacity-90 transition-opacity'
              />
            ) : (
              <div className='text-xs text-slate-600 dark:text-slate-400'>
                { t('edit.original.defaultImage') }
              </div>
            )}
           
          </div>
          
          {/* Video - Editable */}
          <div className='bg-slate-200 dark:bg-slate-700 rounded-lg p-3 text-center'>
            <div className='text-xs font-bold text-slate-800 dark:text-slate-200 mb-2'>
              { t('edit.original.video') }
            </div>
            { selectedGame?.defaultVideo ? (
              <MediaViewer
                mediaUrl={selectedGame.defaultVideo}
                mediaType="video"
                title={t('edit.original.video')}
                alt="Original Video"
                className='w-full aspect-[180/280] object-cover rounded mb-2 cursor-pointer hover:opacity-90 transition-opacity'
                controls={true}
              />
            ) : (
              <div className='text-xs text-slate-600 dark:text-slate-400'>
                { t('edit.original.defaultVideo') }
              </div>
            )}
          </div>
        </div>
        
        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-2'>
          <Button 
            icon='refresh-cw' 
            text={ t('edit.original.regenerateVideo') } 
            onClick={ regenerateOriginalVideo }
            disabled={ originalLocked || !selectedGame }
            className='w-full'
            color='blue'
          />
          <Button 
            icon='trash-2' 
            text={ t('edit.original.deleteVideo') } 
            onClick={ clearOriginalVideo }
            color='red'
            disabled={ originalLocked || !selectedGame }
            className='w-full'
          />
          </div>
          
          <div className='flex items-center justify-end'>
            <span className='text-sm text-slate-600 dark:text-slate-400 mr-2'>
              { t('edit.original.lock') }
            </span>
            <Switch
              name="originalLock"
              value={ originalLocked }
              onChange={ (e) => setOriginalLocked(e.target.value) }
              disabled={ !selectedGame }
            />
          </div>
          
        </div>
      </div>
      
      <RegenerateAiAssetsDialog
        isOpen={showRegenerateDialog}
        onClose={setShowRegenerateDialog}
        selectedGame={selectedGame}
        assetType="original"
        t={t}
      />
    </Card>
  );
}
