/***
*
*   EDIT VIEW
*   Image editing view with game selection dropdown.
*
**********/

import { useState, useCallback, useContext, useEffect } from 'react';
import { ViewContext, Animate, useAPI, useParams } from 'components/lib';
import { GameSelector } from 'components/edit/GameSelector';
import { EditHeader } from 'components/edit/EditHeader';
import { OriginalAssets } from 'components/edit/OriginalAssets';
import { CurrentAssets } from 'components/edit/CurrentAssets';
import { ThemeAssets } from 'components/edit/ThemeAssets';
import Axios from 'axios';

export function Edit({ t }){

  const viewContext = useContext(ViewContext);
  const { gameId } = useParams();
  const [selectedGame, setSelectedGame] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  

  const gamesRes = useAPI('/api/game', 'get', refreshTrigger);

  const handleGameSelect = (game) => {
    console.log('Selected game:', game);
    setSelectedGame(game);
  };

  const handleGameUpdate = useCallback(() => {

    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Auto-select game from URL parameter when games data loads
  useEffect(() => {
    if (gamesRes.data && gameId && !selectedGame) {
      // Find the game matching the URL parameter
      const game = gamesRes.data.find(g => g.id === parseInt(gameId) || g.id === gameId);
      if (game) {
        setSelectedGame(game);
      }
    }
  }, [gamesRes.data, gameId, selectedGame]);

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

  const handlePublish = useCallback(async (publishedType) => {
    if (!selectedGame) {
      viewContext.notification({
        description: t('edit.save.noGame'),
        variant: 'error'
      });
      return;
    }

    try {
      const res = await Axios({
        method: 'POST',
        url: `/api/game/${selectedGame.id}/publish`,
        data: { publishedType }
      });

      viewContext.notification({
        description: t('edit.save.publish.success'),
        variant: 'success'
      });
      // Refresh the games data to get updated published status
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error publishing game:', error);
      viewContext.notification({
        description: t('edit.save.publish.error'),
        variant: 'error'
      });
    }
  }, [selectedGame, t, viewContext]);


  return (
    <Animate type='pop'>
      <div className='space-y-6'>

        <GameSelector t={t} onGameSelect={handleGameSelect} games={gamesRes.data || []} selectedGame={selectedGame} />

    
        <EditHeader 
          t={t} 
          selectedGame={selectedGame} 
          onSaveAndPublish={handlePublish} 
        />

    
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 justify-center items-center'>
      
          <OriginalAssets 
            t={t} 
            selectedGame={selectedGame} 
            onGameUpdate={handleGameUpdate}
            onPublish={handlePublish}
          />

       
          <CurrentAssets 
            t={t} 
            selectedGame={selectedGame} 
            onGameUpdate={handleGameUpdate}
            onPublish={handlePublish}
          />

         
          <ThemeAssets 
            t={t} 
            selectedGame={selectedGame} 
            onGameUpdate={handleGameUpdate}
            onPublish={handlePublish}
          />
        </div>
      </div>
    </Animate>
  );
}
