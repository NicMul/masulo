/***
*
*   ORIGINAL ASSETS COMPONENT
*   Displays original game assets (read-only)
*
**********/

import { Card } from 'components/lib';
import { MediaViewer } from './MediaViewer';

export function OriginalAssets({ t, selectedGame }) {
  return (
    <Card title={ t('edit.original.title') }>
      <div className='space-y-4'>
        {/* Image and Video Row */}
        <div className='grid grid-cols-2 gap-3'>
          {/* Image */}
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
          
          {/* Video */}
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
        
        <div className='text-xs text-slate-500 dark:text-slate-400 text-center'>
          { t('edit.original.readOnly') }
        </div>
      </div>
    </Card>
  );
}
