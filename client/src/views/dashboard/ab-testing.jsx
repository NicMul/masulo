/***
*
*   A/B TESTING VIEW
*   A/B testing management view for promotions and content
*
**********/

import { useState, useContext, useCallback, useEffect } from 'react';
import { ViewContext, Animate, Card, Button, Table, useAPI, useNavigate, useLocation } from 'components/lib';
import { useMutation } from 'components/hooks/mutation';
import { DeleteABTestDialog } from 'components/ab-test/DeleteABTestDialog';
import { ABTestResultsDialog } from 'components/ab-test/ABTestResultsDialog';

export function ABTesting({ t }) {
  // context
  const viewContext = useContext(ViewContext);
  const navigate = useNavigate();
  const location = useLocation();

  // mutations
  const deleteABTestMutation = useMutation('/api/ab-test', 'DELETE');

  // state
  const [abTests, setAbTests] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [abTestToDelete, setAbTestToDelete] = useState(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [abTestForResults, setAbTestForResults] = useState(null);

  // fetch AB tests data
  const res = useAPI('/api/ab-test', 'get', refreshTrigger);
  
  // fetch games data to map gameId to friendly name
  const gamesRes = useAPI('/api/game');

  // Refresh data when navigating back from create/edit pages
  useEffect(() => {
    if (location.pathname === '/ab-testing') {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [location.pathname]);

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

  // handle create A/B test - navigate to create page
  const handleCreateABTest = () => {
    navigate('/ab-testing/create');
  };

  // Handle edit AB test - navigate to edit page
  const handleEditABTest = useCallback((abTest) => {
    navigate(`/ab-testing/edit/${abTest.id}`);
  }, [navigate]);

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

  // Handle view results AB test
  const handleViewResults = useCallback((abTest) => {
    setAbTestForResults(abTest);
    setShowResultsDialog(true);
  }, []);

  // Table actions
  const actions = [
    {
      label: 'View Results',
      icon: 'chart-line',
      action: ({ row }) => handleViewResults(row)
    },
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
          <div/>
          <Button
            icon='plus'
            color='green'
            text={t('ab_testing.create_test')}
            onClick={handleCreateABTest}
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

      {/* AB Test Results Dialog */}
      <ABTestResultsDialog
        isOpen={showResultsDialog}
        onClose={() => {
          setShowResultsDialog(false);
          setAbTestForResults(null);
        }}
        abTest={abTestForResults}
        t={t}
      />
    </Animate>
  );
}
