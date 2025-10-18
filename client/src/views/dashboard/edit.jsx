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
import { StandardAssets } from 'components/edit/StandardAssets';
import { ThemeAssets } from 'components/edit/ThemeAssets';

export function Edit({ t }){

  // context
  const viewContext = useContext(ViewContext);

  // state
  const [selectedGame, setSelectedGame] = useState(null);

  // handle game selection
  const handleGameSelect = (game) => {
    console.log('Selected game:', game);
    setSelectedGame(game);
  };

  // save and publish changes
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

  // Debug logging
  console.log('Current selectedGame:', selectedGame);

  return (
    <Animate type='pop'>
      <div className='space-y-6'>
        {/* Game Selection */}
        <GameSelector t={t} onGameSelect={handleGameSelect} />

        {/* Header Section */}
        <EditHeader 
          t={t} 
          selectedGame={selectedGame} 
          onSaveAndPublish={saveAndPublish} 
        />

        {/* Three Column Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Original Asset Column */}
          <OriginalAssets t={t} selectedGame={selectedGame} />

          {/* Standard AI Content Column */}
          <StandardAssets t={t} selectedGame={selectedGame} />

          {/* Theme AI Content Column */}
          <ThemeAssets t={t} selectedGame={selectedGame} />
        </div>
      </div>
    </Animate>
  );
}
