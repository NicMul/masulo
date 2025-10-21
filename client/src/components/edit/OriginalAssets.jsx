/***
*
*   ORIGINAL ASSETS COMPONENT
*   Displays original game assets with video regeneration capability
*
**********/

import { useState } from 'react';
import { Card, Button, Switch } from 'components/lib';
import { RegenerateAiAssetsDialog } from './RegenerateAiAssetsDialog';
import  MediaPlayer from './MediaPlayer';

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

  const handleSelect = (videoUrl) => {
    console.log('Selected video:', videoUrl);
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
        
              <MediaPlayer
                gameId={selectedGame?.id}
                imageUrl={selectedGame?.defaultImage}
                videoUrl={selectedGame?.defaultVideo}
                onSelect={handleSelect}
                type="image"
                canSelect={false}
                showPlayIcon={false}
                readOnly={true}
              />
                
          </div>
          
          {/* Video - Editable */}
          <div className='bg-slate-200 dark:bg-slate-700 rounded-lg p-3 text-center'>
            <div className='text-xs font-bold text-slate-800 dark:text-slate-200 mb-2'>
              { t('edit.original.video') }
            </div>

              <MediaPlayer
                gameId={selectedGame?.id}
                imageUrl={selectedGame?.defaultImage}
                videoUrl={selectedGame?.defaultVideo}
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
        onClose={() => setShowRegenerateDialog(false)}
        selectedGame={selectedGame}
        assetType="original"
        t={t}
      />
    </Card>
  );
}
