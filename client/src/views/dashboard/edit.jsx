/***
*
*   EDIT VIEW
*   Image editing view with game selection dropdown.
*
**********/

import { useState, useCallback, useContext } from 'react';
import { ViewContext, Animate } from 'components/lib';
import { GameSelector } from 'components/edit/GameSelector';
import { EditHeader } from 'components/edit/EditHeader';
import { ContentSourceBanner } from 'components/edit/ContentSourceBanner';
import { OriginalAssets } from 'components/edit/OriginalAssets';
import { CurrentAssets } from 'components/edit/CurrentAssets';
import { ThemeAssets } from 'components/edit/ThemeAssets';

export function Edit({ t }){


  const viewContext = useContext(ViewContext);
  const [selectedGame, setSelectedGame] = useState(null);

  const handleGameSelect = (game) => {
    console.log('Selected game:', game);
    setSelectedGame(game);
  };

  const saveAndPublish = useCallback(() => {
    if (!selectedGame) {
      viewContext.notification({
        description: t('edit.save.noGame'),
        variant: 'error'
      });
      return;
    }

    viewContext.notification({
      description: t('edit.save.publish.success'),
      variant: 'success'
    });
  }, [selectedGame, t, viewContext]);

  console.log('Current selectedGame:', selectedGame);

  return (
    <Animate type='pop'>
      <div className='space-y-6'>

        <GameSelector t={t} onGameSelect={handleGameSelect} />

    
        <EditHeader 
          t={t} 
          selectedGame={selectedGame} 
          onSaveAndPublish={saveAndPublish} 
        />

    
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      
          <OriginalAssets t={t} selectedGame={selectedGame} />

       
          <CurrentAssets t={t} selectedGame={selectedGame} />

         
          <ThemeAssets t={t} selectedGame={selectedGame} />
        </div>
      </div>
    </Animate>
  );
}
