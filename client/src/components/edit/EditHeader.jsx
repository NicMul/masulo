/***
*
*   EDIT HEADER COMPONENT
*   Displays game title, version, CMS ID, and control switches
*
**********/

import { useState, useEffect } from 'react';
import { Button, Switch } from 'components/lib';

export function EditHeader({ t, selectedGame, onSaveAndPublish }) {
  const [animateEnabled, setAnimateEnabled] = useState(false);
  const [hoverEnabled, setHoverEnabled] = useState(false);

  // Update animate and hover state when game is selected
  useEffect(() => {
    if (selectedGame) {
      setAnimateEnabled(selectedGame.animate || false);
      setHoverEnabled(selectedGame.hover || false);
    } else {
      setAnimateEnabled(false);
      setHoverEnabled(false);
    }
  }, [selectedGame]);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
            { selectedGame ? t('edit.header.title', { gameName: selectedGame.cmsId }) : t('edit.header.titleDefault') }
          </h1>
          <p className='text-sm text-slate-600 dark:text-slate-400'>
            { selectedGame ? t('edit.header.version', { version: selectedGame.version }) : t('edit.header.versionDefault') }
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <div className='bg-slate-800 dark:bg-slate-800 rounded-md p-2 text-sm text-slate-200 dark:text-slate-400'>
            { selectedGame ? t('edit.header.cmsId', { cmsId: selectedGame.cmsId }) : t('edit.header.cmsIdDefault') }
          </div>
          <div className='flex items-center gap-2'>
            <Switch
              name="animate"
              value={ animateEnabled }
              label={ t('edit.header.animate') }
              onChange={ (e) => setAnimateEnabled(e.target.value) }
              disabled={ !selectedGame }
            />
            <Switch
              name="hover"
              value={ hoverEnabled }
              label={ t('edit.header.hover') }
              onChange={ (e) => setHoverEnabled(e.target.value) }
              disabled={ !selectedGame }
            />
          </div>
          <Button 
            icon='save' 
            text={ t('edit.header.savePublish') } 
            onClick={ onSaveAndPublish }
            disabled={ !selectedGame }
          />
        </div>
      </div>
    </div>
  );
}
