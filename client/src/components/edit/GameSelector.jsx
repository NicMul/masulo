/***
*
*   GAME SELECTOR COMPONENT
*   Handles game selection dropdown with its own state
*
**********/

import { useState, useEffect } from 'react';
import { Card, Select, useAPI } from 'components/lib';

export function GameSelector({ t, onGameSelect }) {
  const [games, setGames] = useState([]);
  
  // fetch games data
  const res = useAPI('/api/game');

  // update state when data loads
  useEffect(() => {
    if (res.data) {
      setGames(res.data);
    }
  }, [res.data]);

  // handle game selection
  const handleGameSelect = (event) => {
    const gameId = event.target.value;
    console.log('Selected gameId:', gameId, 'Type:', typeof gameId);
    console.log('Available games:', games.map(g => ({ id: g.id, cmsId: g.cmsId })));
    
    // Try both string and number matching
    let game = games.find(g => g.id === parseInt(gameId));
    if (!game) {
      game = games.find(g => g.id === gameId);
    }
    if (!game) {
      game = games.find(g => g.id.toString() === gameId.toString());
    }
    
    console.log('Found game:', game);
    onGameSelect(game);
  };

  // prepare options for dropdown
  const gameOptions = games.map(game => ({
    value: game.id,
    label: game.cmsId
  }));

  return (
    <Card>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
            { t('edit.game.select.label') }
          </label>
          <Select
            name='game'
            options={ gameOptions }
            onChange={ handleGameSelect }
            placeholder={ t('edit.game.select.placeholder') }
            className='w-full'
          />
        </div>
      </div>
    </Card>
  );
}
