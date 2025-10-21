/***
*
*   EDIT VIEW
*   Image editing view with game selection dropdown.
*
**********/

import { useState, useCallback, useContext, useEffect } from 'react';
import { ViewContext, Animate, useAPI } from 'components/lib';
import { GameSelector } from 'components/edit/GameSelector';
import { EditHeader } from 'components/edit/EditHeader';
import { ContentSourceBanner } from 'components/edit/ContentSourceBanner';
import { OriginalAssets } from 'components/edit/OriginalAssets';
import { CurrentAssets } from 'components/edit/CurrentAssets';
import { ThemeAssets } from 'components/edit/ThemeAssets';

export function Edit({ t }){

  const viewContext = useContext(ViewContext);
  const [selectedGame, setSelectedGame] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Fetch games data for refetching
  const gamesRes = useAPI('/api/game', 'get', refreshTrigger);

  const handleGameSelect = (game) => {
    console.log('Selected game:', game);
    setSelectedGame(game);
  };

  // Handle game update callback
  const handleGameUpdate = useCallback(() => {
    // Trigger a refetch by updating the trigger
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Update selectedGame when games data changes (after refresh)
  useEffect(() => {
    if (gamesRes.data && selectedGame) {
      // Find the updated game data
      const updatedGame = gamesRes.data.find(g => g.id === selectedGame.id);
      if (updatedGame) {
        setSelectedGame(updatedGame);
      }
    }
  }, [gamesRes.data, selectedGame]);

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

        <GameSelector t={t} onGameSelect={handleGameSelect} games={gamesRes.data || []} />

    
        <EditHeader 
          t={t} 
          selectedGame={selectedGame} 
          onSaveAndPublish={saveAndPublish} 
        />

    
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      
          <OriginalAssets t={t} selectedGame={selectedGame} />

       
          <CurrentAssets t={t} selectedGame={selectedGame} onGameUpdate={handleGameUpdate} />

         
          <ThemeAssets t={t} selectedGame={selectedGame} onGameUpdate={handleGameUpdate} />
        </div>
      </div>
    </Animate>
  );
}
