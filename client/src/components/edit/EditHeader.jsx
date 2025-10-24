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
  const [touchEnabled, setTouchEnabled] = useState(false);

  // Update animate and hover state when game is selected
  useEffect(() => {
    if (selectedGame) {
      setAnimateEnabled(selectedGame.animate || false);
      setHoverEnabled(selectedGame.hover || false);
      setTouchEnabled(selectedGame.touch || false);
    } else {
      setAnimateEnabled(false);
      setHoverEnabled(false);
      setTouchEnabled(false);
    }
  }, [selectedGame]);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
            { selectedGame ? t('edit.header.title', { gameName: selectedGame.cmsId.toUpperCase() }) : t('edit.header.titleDefault') }
            <span className='text-ml text-slate-600 dark:text-slate-400'> - v{ selectedGame ? selectedGame.version : t('edit.header.cmsIdDefault') }</span>
          </h1>
          <p className='text-sm text-slate-600 dark:text-slate-400'>
          { selectedGame ? t('edit.header.cmsId', { cmsId: selectedGame.cmsId }) : t('edit.header.cmsIdDefault') }
          </p>
          
        </div>
        <div className='flex'>
        
          <Switch
              name="animate"
              value={ animateEnabled }
              label={ t('edit.header.animate') }
              onChange={ (e) => setAnimateEnabled(e.target.value) }
              disabled={ !selectedGame }
            />
            <div className='mr-4'></div>
            <Switch
              name="hover"
              value={ hoverEnabled }
              label={ t('edit.header.hover') }
              onChange={ (e) => setHoverEnabled(e.target.value) }
              disabled={ !selectedGame }
            />
            <div className='mr-4'></div>
            <Switch
              name="touch"
              value={ touchEnabled }
              label={ t('edit.header.touch') }
              onChange={ (e) => setTouchEnabled(e.target.value) }
              disabled={ !selectedGame }
            />
        </div>
       
        <div className='flex items-center gap-4'>
          
          <div className='flex items-center gap-2'>
            
          </div>
          <Button 
            icon='save' 
            color='green'
            text={ t('edit.header.savePublish') } 
            onClick={ onSaveAndPublish }
            disabled={ !selectedGame }
          />
        </div>
      </div>
    </div>
  );
}
