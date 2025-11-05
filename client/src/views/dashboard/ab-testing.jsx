/***
*
*   A/B TESTING VIEW
*   A/B testing management view for promotions and content
*
**********/

import { useState, useContext, useCallback, useEffect } from 'react';
import { ViewContext, Animate, Card, Button, Table, useAPI } from 'components/lib';
import { useMutation } from 'components/hooks/mutation';
import { ABTestConfigurationDialog } from 'components/ab-test/ABTestConfigurationDialog';
import { DeleteABTestDialog } from 'components/ab-test/DeleteABTestDialog';

export function ABTesting({ t }) {
  // context
  const viewContext = useContext(ViewContext);

  // mutations
  const createABTestMutation = useMutation('/api/ab-test', 'POST');
  const updateABTestMutation = useMutation('/api/ab-test', 'PATCH');
  const deleteABTestMutation = useMutation('/api/ab-test', 'DELETE');

  // state
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentABTest, setCurrentABTest] = useState(null);
  const [abTests, setAbTests] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [abTestToDelete, setAbTestToDelete] = useState(null);

  // fetch AB tests data
  const res = useAPI('/api/ab-test', 'get', refreshTrigger);
  
  // fetch games data to map gameId to friendly name
  const gamesRes = useAPI('/api/game');

  // update state when data loads and map game names
  useEffect(() => {
    if (res.data && gamesRes.data) {
      // Create a map of gameId to friendly name
      const gameMap = {};
      gamesRes.data.forEach(game => {
        gameMap[game.id] = game.friendlyName;
      });

      // Transform AB tests data to include game friendly name
      const transformedAbTests = res.data.map(abTest => ({
        ...abTest,
        gameName: gameMap[abTest.gameId] || abTest.gameId
      }));

      setAbTests(transformedAbTests);
    } else if (res.data) {
      // If games haven't loaded yet, just use the gameId
      setAbTests(res.data);
    }
  }, [res.data, gamesRes.data]);

  // handle create A/B test
  const handleCreateABTest = () => {
    setCurrentABTest(null);
    setDialogOpen(true);
  };

  // Handle form submission - create or update AB test via API
  const handleFormSubmit = useCallback(async (formData) => {
    try {
      setIsLoading(true);

      // Transform form data to match API expectations
      const payload = {
        name: formData.name,
        description: formData.description,
        group: formData.group,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        gameId: formData.selectedGame?.id || '',
        approvedBy: formData.approvedBy || '',
        published: formData.published || false,
        analyticsId: currentABTest?.analyticsId || '',  // preserve existing or empty string
        imageVariantA: formData.imageVariantA || '',
        videoVariantA: formData.videoVariantA || '',
        imageVariantB: formData.imageVariantB || '',
        videoVariantB: formData.videoVariantB || ''
      };

      const isEditing = currentABTest && currentABTest.id;

      console.log(isEditing ? 'Updating AB Test with payload:' : 'Creating AB Test with payload:', payload);

      // Make API call (create or update)
      const result = isEditing 
        ? await updateABTestMutation.execute(payload, `/api/ab-test/${currentABTest.id}`)
        : await createABTestMutation.execute(payload);

      if (result) {
        // Close dialog
        setDialogOpen(false);
        
        // Show success notification
        viewContext.notification({
          description: result.message || (isEditing ? 'AB Test updated successfully' : 'AB Test created successfully'),
          variant: 'success'
        });

        // Refresh AB test list
        setRefreshTrigger(prev => prev + 1);
      } else {
        // Show error notification
        viewContext.notification({
          description: isEditing ? 'Failed to update AB Test' : 'Failed to create AB Test',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving AB test:', error);
      viewContext.notification({
        description: 'An error occurred while saving the AB Test',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [viewContext, createABTestMutation, updateABTestMutation, currentABTest]);

  // Handle edit AB test
  const handleEditABTest = useCallback((abTest) => {
    // Find the full game object from gamesRes
    const gameObject = gamesRes.data?.find(game => game.id === abTest.gameId);
    
    // Prepare the AB test data with the full game object
    const abTestWithGame = {
      ...abTest,
      selectedGame: gameObject || null
    };
    
    setCurrentABTest(abTestWithGame);
    setDialogOpen(true);
  }, [gamesRes.data]);

  // Handle delete AB test - open confirmation dialog
  const handleDeleteABTest = useCallback((abTest) => {
    setAbTestToDelete(abTest);
    setShowDeleteDialog(true);
  }, []);

  // Confirm and execute delete AB test
  const confirmDeleteABTest = useCallback(async () => {
    if (!abTestToDelete) return;

    try {
      const result = await deleteABTestMutation.execute(null, `/api/ab-test/${abTestToDelete.id}`);

      if (result) {
        viewContext.notification({
          description: result.message || 'AB Test deleted successfully',
          variant: 'success'
        });

        // Refresh AB test list
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error deleting AB test:', error);
      viewContext.notification({
        description: 'An error occurred while deleting the AB Test',
        variant: 'error'
      });
    } finally {
      setShowDeleteDialog(false);
      setAbTestToDelete(null);
    }
  }, [abTestToDelete, viewContext, deleteABTestMutation]);

  // Table actions
  const actions = [
    {
      label: 'Edit',
      icon: 'pencil',
      action: ({ row }) => handleEditABTest(row)
    },
    {
      label: 'Delete',
      icon: 'trash',
      action: ({ row }) => handleDeleteABTest(row)
    }
  ];

  return (
    <Animate type='pop'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
              {t('ab_testing.title')}
            </h1>
            <p className='text-slate-600 dark:text-slate-400 mt-1'>
              {t('ab_testing.description')}
            </p>
          </div>
          <Button
            icon='plus'
            color='green'
            text={t('ab_testing.create_test')}
            onClick={handleCreateABTest}
            disabled={isLoading}
          />
        </div>

        {/* AB Tests Table */}
        <Card>
          <Table
            sortable="true"
            selectable
            searchable
            data={abTests}
            loading={res.loading || gamesRes.loading}
            actions={actions}
            show={['name', 'description', 'group', 'gameName', 'startDate', 'endDate', 'published', 'approvedBy']}
            badge={[
              {
                col: 'published',
                color: 'green',
                condition: [
                  { value: true, color: 'green' },
                  { value: false, color: 'red' }
                ]
              }
            ]}
          />
        </Card>
      </div>

      {/* AB Test Configuration Dialog */}
      <ABTestConfigurationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        abTest={currentABTest}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteABTestDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setAbTestToDelete(null);
        }}
        onConfirm={confirmDeleteABTest}
        abTestName={abTestToDelete?.name || ''}
        t={t}
      />
    </Animate>
  );
}
