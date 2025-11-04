/***
*
*   GAMES VIEW
*   Games management view displaying user's games in a table.
*
**********/

import { useContext, useCallback, useState, useEffect } from 'react';
import { ViewContext, Card, Table, Animate, useAPI, Button, useNavigate, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from 'components/lib';
import { GameEditForm } from 'components/games/GameEditForm';
import { GameCreateForm } from 'components/games/GameCreateForm';
import { BulkActionsDialog } from 'components/games/BulkActionsDialog';
import { BulkDeleteDialog } from 'components/games/BulkDeleteDialog';
import { GameMediaViewDialog } from 'components/games/GameMediaViewDialog';
import { useMutation } from 'components/hooks/mutation';
import axios from 'axios';

export function Games({ t }){
  const [bulkAction, setBulkAction] = useState(false);
  const [selectedGames, setSelectedGames] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewGameMedia, setShowViewGameMedia] = useState(false);
  const [selectedGameForView, setSelectedGameForView] = useState(null);

  // context
  const viewContext = useContext(ViewContext);
  const navigate = useNavigate();

  // state
  const [games, setGames] = useState([]);

  // fetch games data
  const res = useAPI('/api/game');
  
  // Bulk operation mutations
  const bulkUpdateMutation = useMutation('/api/game/bulk', 'PATCH');
  const bulkDeleteMutation = useMutation('/api/game/bulk', 'DELETE');

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

  // open view game media dialog
  const openViewGameMedia = useCallback((game) => {
    setSelectedGameForView(game);
    setShowViewGameMedia(true);
  }, []);

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  // Execute bulk changes (publish, publishedType, group)
  const executeBulkChanges = useCallback(async (changes) => {
    try {
      const gameIds = selectedGames.map(g => g.id);
      
      const result = await bulkUpdateMutation.execute({
        gameIds,
        ...changes
      });
      
      if (result) {
        // Update local state based on changes
        setGames(prevGames => prevGames.map(game => {
          if (!gameIds.includes(game.id)) return game;
          
          const updatedGame = { ...game };
          if (changes.published !== undefined) {
            updatedGame.published = changes.published;
          }
          if (changes.publishedType !== undefined) {
            updatedGame.publishedType = changes.publishedType;
          }
          if (changes.group !== undefined) {
            updatedGame.group = changes.group;
          }
          return updatedGame;
        }));
        
        // Clear selection
        setSelectedGames([]);
        
        // Show success notification
        const changeTypes = [];
        if (changes.published !== undefined) {
          changeTypes.push(changes.published ? 'published' : 'unpublished');
        }
        if (changes.publishedType !== undefined) {
          changeTypes.push('published type updated');
        }
        if (changes.group !== undefined) {
          changeTypes.push('group updated');
        }

        setSelectedGames([]);
        
        viewContext.notification({
          description: `Games ${changeTypes.join(', ')} successfully`,
          variant: 'success'
        });
      }
    } catch (error) {
      setSelectedGames([]);
      viewContext.notification({
        description: 'Error updating games',
        variant: 'error'
      });
    }
  }, [selectedGames, bulkUpdateMutation, viewContext]);

  // Execute bulk delete
  const executeBulkDelete = useCallback(async () => {
    try {
      const gameIds = selectedGames.map(g => g.id);
      
      const result = await bulkDeleteMutation.execute({
        gameIds
      });
      
      if (result) {
        // Update local state - remove deleted games
        setGames(prevGames => prevGames.filter(game => !gameIds.includes(game.id)));
        
        // Clear selection
        setSelectedGames([]);
        
        // Show success notification
        viewContext.notification({
          description: t('games.bulk.delete.success'),
          variant: 'success'
        });
        
        setShowDeleteDialog(false);
        setSelectedGames([]);
      }
    } catch (error) {
      setSelectedGames([]);
      viewContext.notification({
        description: 'Error deleting games',
        variant: 'error'
      });
    }
  }, [selectedGames, bulkDeleteMutation, viewContext, t]);

  const actions = [
    {
      label: t('games.view.action'),
      icon: 'eye',
      globalOnly: false,
      action: ({ row }) => openViewGameMedia(row)
    },
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
      <Card title={ t('games.table.title') } headerAction={
        <div className="flex gap-2">
          <Button 
            disabled={ !selectedGames.length } 
            color='red' 
            icon='trash-2' 
            text={ t('games.bulk.delete.action') } 
            onClick={ handleBulkDelete } 
          />
          <Button 
            disabled={ !selectedGames.length } 
            color='blue' 
            icon='edit' 
            text={ t('games.action.bulk') } 
            onClick={ () => setBulkAction(true) } 
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button color='primary' icon='sheet' text={ t('games.csv.action') } />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem>
                <Button 
                  variant='naked' 
                  icon='download' 
                  text={ t('games.template.action') } 
                  onClick={ downloadTemplate }
                  className='justify-start'
                />
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Button 
                  variant='naked' 
                  icon='upload' 
                  text={ t('games.csv.action') } 
                  onClick={ uploadCSV }
                  className='justify-start'
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button color='green' icon='plus' text={ t('games.create.action') } onClick={ createGame } />
        </div>
      }>
        
        <Table
        sortable="true"
        selectable
        searchable
          data={ games }
          loading={ res.loading }
          actions={ actions }
          onSelectionChange={(selection) => {
            // Map selection to full game objects
            const selected = selection.map(s => games.find(g => g.id === s.id)).filter(Boolean);
            setSelectedGames(selected);
          }}
          show={ ['published', 'version', 'friendlyName','cmsId', 'group', 'theme', 'defaultImage', 'currentImage', 'themeImage', 'animate', 'hover', 'touch'] }
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
      
      {/* Bulk Action Dialogs */}
      <BulkActionsDialog
        isOpen={bulkAction}
        onClose={() => setBulkAction(false)}
        selectedGames={selectedGames}
        onApplyChanges={executeBulkChanges}
        t={t}
      />
      
      <BulkDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={executeBulkDelete}
        isDeleting={bulkDeleteMutation.loading}
        selectedGames={selectedGames}
        t={t}
      />
      
      {/* Game Media View Dialog */}
      <GameMediaViewDialog
        isOpen={showViewGameMedia}
        onClose={() => setShowViewGameMedia(false)}
        game={selectedGameForView}
        t={t}
      />
    </Animate>
  );
}
