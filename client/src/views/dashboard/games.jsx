/***
*
*   GAMES VIEW
*   Games management view displaying user's games in a table.
*
**********/

import { useContext, useCallback, useState, useEffect } from 'react';
import { ViewContext, Card, Table, Animate, useAPI, Button } from 'components/lib';
import axios from 'axios';

export function Games({ t }){

  // context
  const viewContext = useContext(ViewContext);

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
  const createGame = useCallback(({ editRowCallback }) => {
    viewContext.dialog.open({
      title: t('games.create.title'),
      form: {
        inputs: {
          cmsId: {
            label: t('games.form.cmsId.label'),
            type: 'text',
            required: true,
            errorMessage: t('games.form.cmsId.error')
          },
          defaultImage: {
            label: t('games.form.defaultImage.label'),
            type: 'text',
            required: true,
            errorMessage: t('games.form.defaultImage.error')
          },
          defaultVideo: {
            label: t('games.form.defaultVideo.label'),
            type: 'text',
            required: false
          },
          currentImage: {
            label: t('games.form.currentImage.label'),
            type: 'text',
            required: false
          },
          currentVideo: {
            label: t('games.form.currentVideo.label'),
            type: 'text',
            required: false
          },
          themeImage: {
            label: t('games.form.themeImage.label'),
            type: 'text',
            required: false
          },
          themeVideo: {
            label: t('games.form.themeVideo.label'),
            type: 'text',
            required: false
          },
          animate: {
            label: t('games.form.animate.label'),
            type: 'switch',
            required: false,
            defaultValue: false
          },
          hover: {
            label: t('games.form.hover.label'),
            type: 'switch',
            required: false,
            defaultValue: false
          },
          version: {
            label: t('games.form.version.label'),
            type: 'number',
            required: true,
            value: 1,
            errorMessage: t('games.form.version.error')
          }
        },
        buttonText: t('games.create.button'),
        url: '/api/game',
        method: 'POST'
      }
    }, (formData) => {
      // add new game to state
      setGames([formData, ...games]);
    });
  }, [games, t, viewContext]);

  // edit game
  const editGame = useCallback(({ row, editRowCallback }) => {
    viewContext.dialog.open({
      title: t('games.edit.title'),
      form: {
        inputs: {
          id: {
            type: 'hidden',
            value: row.id
          },
          cmsId: {
            label: t('games.form.cmsId.label'),
            type: 'text',
            required: true,
            value: row.cmsId,
            errorMessage: t('games.form.cmsId.error')
          },
          defaultImage: {
            label: t('games.form.defaultImage.label'),
            type: 'text',
            required: true,
            value: row.defaultImage,
            errorMessage: t('games.form.defaultImage.error')
          },
          defaultVideo: {
            label: t('games.form.defaultVideo.label'),
            type: 'text',
            required: false,
            value: row.defaultVideo
          },
          currentImage: {
            label: t('games.form.currentImage.label'),
            type: 'text',
            required: false,
            value: row.currentImage
          },
          currentVideo: {
            label: t('games.form.currentVideo.label'),
            type: 'text',
            required: false,
            value: row.currentVideo
          },
          themeImage: {
            label: t('games.form.themeImage.label'),
            type: 'text',
            required: false,
            value: row.themeImage
          },
          themeVideo: {
            label: t('games.form.themeVideo.label'),
            type: 'text',
            required: false,
            value: row.themeVideo
          },
          animate: {
            label: t('games.form.animate.label'),
            type: 'switch',
            required: false,
            defaultValue: row.animate
          },
          hover: {
            label: t('games.form.hover.label'),
            type: 'switch',
            required: false,
            defaultValue: row.hover
          },
          version: {
            label: t('games.form.version.label'),
            type: 'number',
            required: true,
            value: row.version,
            errorMessage: t('games.form.version.error')
          }
        },
        buttonText: t('games.edit.button'),
        url: `/api/game/${row.id}`,
        method: 'PATCH'
      }
    }, (formData) => {
      const newState = editRowCallback(formData);
      setGames(newState);
    });
  }, [t, viewContext]);

  // delete game
  const deleteGame = useCallback(({ row, deleteRowCallback }) => {
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
      const newState = deleteRowCallback(row);
      setGames(newState);
    });
  }, [t, viewContext]);

  const actions = [
    {
      label: t('games.create.action'),
      icon: 'plus',
      global: true,
      color: 'green',
      action: createGame
    },
    {
      label: t('games.csv.action'),
      icon: 'upload',
      global: true,
      color: 'blue',
      action: uploadCSV
    },
    {
      label: t('games.template.action'),
      icon: 'download',
      global: true,
      color: 'gray',
      action: downloadTemplate
    },
    {
      label: t('games.edit.action'),
      icon: 'pencil',
      globalOnly: false,
      action: editGame
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
          searchable
          data={ games }
          loading={ res.loading }
          actions={ actions }
          show={ ['cmsId', 'defaultImage', 'currentImage', 'themeImage', 'animate', 'hover', 'version'] }
          badge={ [
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
