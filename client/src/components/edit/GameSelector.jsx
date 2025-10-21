/***
*
*   GAME SELECTOR COMPONENT
*   Handles game selection dropdown with its own state
*
**********/

import { Card, Select } from 'components/lib';

export function GameSelector({ t, onGameSelect, games = [] }) {
  const handleGameSelect = (event) => {
    const gameId = event.target.value;

    let game = games.find(g => g.id === parseInt(gameId));
    if (!game) {
      game = games.find(g => g.id === gameId);
    }
    if (!game) {
      game = games.find(g => g.id.toString() === gameId.toString());
    }
  
    onGameSelect(game);
  };

  const gameOptions = games.map(game => ({
    value: game.id,
    label: game.cmsId
  }));

  return (
    <Card>
      <div className='space-y-4'>
        <div className='w-1/4'>
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
