/***
*
*   CONTENT SOURCE BANNER COMPONENT
*   Displays live content source notification banner
*
**********/

import { useState } from 'react';

export function ContentSourceBanner({ t }) {
  const [liveContentSource] = useState('theme'); // 'original', 'standard', 'theme'

  return (
    <div className='bg-orange-100 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg p-4'>
      <div className='font-semibold text-orange-800 dark:text-orange-200'>
        { t('edit.banner.title') }
      </div>
      <div className='text-sm text-orange-700 dark:text-orange-300'>
        { t('edit.banner.description', { source: t(`edit.banner.source.${liveContentSource}`) }) }
      </div>
    </div>
  );
}
