/***
*
*   GAMES VIEW
*   Games management view displaying user's games in a table.
*
**********/

import { useContext, useCallback, useState, useEffect } from 'react';
import { ViewContext, Card, Table, Animate, useAPI, Button, useNavigate } from 'components/lib';
import { GameEditForm } from 'components/games/GameEditForm';
import { GameCreateForm } from 'components/games/GameCreateForm';
import axios from 'axios';

export function Games({ t }){

  // context
  const viewContext = useContext(ViewContext);
  const navigate = useNavigate();

  // state
  const [games, setGames] = useState([]);

  // fetch games data
  const res = useAPI('/api/game');

  // update state when data loads
  useEffect(() => {
    if (res.data) {
      setGames(res.data);
    }
  }, [res.data]);

  // CSV upload for bulk games
  const uploadCSV = useCallback(() => {
    viewContext.dialog.open({
      title: t('games.csv.title'),
      description: t('games.csv.description'),
      form: {
        inputs: {
          file: {
            label: t('games.csv.file.label'),
            type: 'file',
            required: true,
            accept: ['text/csv', 'application/csv', '.csv'],
            errorMessage: t('games.csv.file.error')
          }
        },
        buttonText: t('games.csv.button'),
        url: '/api/game/bulk',
        method: 'POST'
      }
    }, (response) => {
      // refresh games data
      if (response.data) {
        setGames(response.data);
      }
    });
  }, [t, viewContext]);

  // Download CSV template
  const downloadTemplate = useCallback(async () => {
    try {
      const response = await axios({
        method: 'GET',
        url: '/api/game/template',
        responseType: 'blob'
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'games_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      viewContext.notification({ 
        description: t('games.template.error'),
        variant: 'error'
      });
    }
  }, [t, viewContext]);

  // create new game
  const createGame = useCallback(() => {
    viewContext.dialog.open({
      title: t('games.create.title'),
      className: 'max-w-4xl w-full',
      children: (
        <GameCreateForm
          onSuccess={(newGame) => {
            setGames(prevGames => [newGame, ...prevGames]);
            viewContext.notification({
              description: t('games.game_created'),
              variant: 'success'
            });
            viewContext.dialog.close();
          }}
          onCancel={() => viewContext.dialog.close()}
          t={t}
        />
      )
    });
  }, [t, viewContext]);

  // edit game
  const editGame = useCallback(({ row }) => {
    viewContext.dialog.open({
      title: t('games.edit.title'),
      className: 'max-w-4xl w-full',
      children: (
        <GameEditForm
          game={row}
          onSuccess={(updatedGame) => {
            setGames(prevGames => prevGames.map(g => g.id === row.id ? updatedGame : g));
            viewContext.notification({
              description: t('games.game_updated'),
              variant: 'success'
            });
            viewContext.dialog.close();
          }}
          onCancel={() => viewContext.dialog.close()}
          t={t}
        />
      )
    });
  }, [t, viewContext]);

  // delete game
  const deleteGame = useCallback(({ row }) => {
    viewContext.dialog.open({
      title: t('games.delete.title'),
      description: `${t('games.delete.description')} "${row.cmsId}"?`,
      form: {
        inputs: false,
        buttonText: t('games.delete.button'),
        url: `/api/game/${row.id}`,
        method: 'DELETE',
        destructive: true
      }
    }, () => {
      setGames(prevGames => prevGames.filter(g => g.id !== row.id));
      viewContext.notification({
        description: t('games.game_deleted'),
        variant: 'success'
      });
    });
  }, [t, viewContext]);

  // navigate to edit page with selected game
  const newImages = useCallback(({ row }) => {
    navigate(`/edit/${row.id}`);
  }, [navigate]);

  const actions = [
    {
      label: t('games.edit_game.action'),
      icon: 'pencil',
      globalOnly: false,
      action: editGame
    },
    {
      label: t('games.new_ai_assets.action'),
      icon: 'image',
      globalOnly: false,
      action: newImages
    },
    {
      label: t('games.delete.action'),
      icon: 'trash-2',
      globalOnly: false,
      action: deleteGame
    }
  ];

  return (
    <Animate type='pop'>
      <div className='flex justify-end gap-2 mb-4'>
        <Button icon='download' text={ t('games.template.action') } onClick={ downloadTemplate } />
        <Button icon='upload' text={ t('games.csv.action') } onClick={ uploadCSV } />
        <Button icon='plus' text={ t('games.create.action') } onClick={ createGame } />
      </div>
      <Card title={ t('games.table.title') }>
        
        <Table
        sortable
        selectable
      searchable
          data={ games }
          loading={ res.loading }
          actions={ actions }
          show={ ['published', 'version','cmsId', 'group', 'theme', 'defaultImage', 'currentImage', 'themeImage', 'animate', 'hover', 'touch'] }
          badge={ [
            { 
              col: 'published', 
              color: 'green',
              condition: [
                { value: true, color: 'green' },
                { value: false, color: 'red' }
              ]
            },
            { 
              col: 'touch', 
              color: 'green',
              condition: [
                { value: 'default', color: 'gray' },
                { value: 'promo', color: 'green' },
                { value: 'seasonal', color: 'blue' }
              ]
            },

            { 
              col: 'animate', 
              color: 'blue',
              condition: [
                { value: true, color: 'green' },
                { value: false, color: 'red' }
              ]
            },
            { 
              col: 'hover', 
              color: 'blue',
              condition: [
                { value: true, color: 'green' },
                { value: false, color: 'red' }
              ]
            }
          ]}
        />
      </Card>
    </Animate>
  );
}
