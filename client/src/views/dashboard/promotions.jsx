import { useContext, useCallback, useState, useEffect } from 'react';
import { ViewContext, Card, Table, Animate, useAPI, Button, useMutation, Badge } from 'components/lib';
import { PromotionConfigurationDialog } from 'components/promotions/PromotionConfigurationDialog';

// UTILITY: Function to format dates for HTML input type="date" (YYYY-MM-DD format)
// Placed outside the component to prevent re-creation on every render, 
// and to ensure it's defined before the component uses it.
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    // Use components and pad to ensure 'YYYY-MM-DD' format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Invalid date string provided:", dateString);
    return '';
  }
};

// UTILITY: Function to format time as "6h30 AM" format
const formatTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    // Format minutes with zero padding
    const minutesStr = String(minutes).padStart(2, '0');
    
    // Return format like "6h30 AM" (no leading zero for hours)
    return `${hours}h${minutesStr} ${ampm}`;
  } catch (e) {
    console.error("Invalid time string provided:", dateString);
    return '';
  }
};


export function Promotions({ t }){

  // context
  const viewContext = useContext(ViewContext);

  // state
  const [promotions, setPromotions] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedGames, setSelectedGames] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState(null);

  // fetch promotions data
  const res = useAPI('/api/promotion');

  // fetch games data for form
  const gamesRes = useAPI('/api/game');

  // mutation hooks for create and update
  const createPromotionMutation = useMutation('/api/promotion', 'POST');
  const updatePromotionMutation = useMutation('/api/promotion', 'PATCH');

  // update state when data loads
  useEffect(() => {
    if (res.data) {
      setPromotions(res.data);
    }
  }, [res.data]);

  useEffect(() => {
    if (gamesRes.data) {
      setGames(gamesRes.data);
    }
  }, [gamesRes.data]);
  const createPromotion = useCallback(() => {
    // Reset selected games for new promotion
    setSelectedGames([]);
    setCurrentPromotion(null);
    setDialogOpen(true);
  }, []);

  const editPromotion = useCallback((promotion) => {
    // Handle games field - support both old format (array of IDs/strings) and new format (array of objects)
    let gamesArray = [];
    if (Array.isArray(promotion.games)) {
      if (promotion.games.length === 0) {
        gamesArray = [];
      } else if (typeof promotion.games[0] === 'object' && promotion.games[0].gameCmsId) {
        // New format: array of objects with gameCmsId, promoImage, promoVideo
        // Convert to game IDs for the selector component
        if (gamesRes.data) {
          gamesArray = promotion.games.map(gameObj => {
            const game = gamesRes.data.find(g => g.cmsId === gameObj.gameCmsId);
            return game ? game.id : null;
          }).filter(id => id !== null);
        }
      } else {
        // Old format: array of strings (game IDs)
        gamesArray = promotion.games;
      }
    } else if (typeof promotion.games === 'string' && promotion.games.trim() !== '') {
      // Legacy format: comma-separated string
      const gameNames = promotion.games.split(',').map(game => game.trim()).filter(game => game);
      if (gamesRes.data) {
        gamesArray = gameNames.map(gameName => {
          const game = gamesRes.data.find(g => g.cmsId === gameName);
          return game ? game.id : null;
        }).filter(id => id !== null);
      }
    }
    
    // Set selected games for editing - ensure it's always an array
    setSelectedGames(gamesArray);
    setCurrentPromotion(promotion);
    setDialogOpen(true);
  }, [gamesRes.data]);

  // Handle form submission
  const handleFormSubmit = useCallback(async (formData) => {
    try {
      const mutation = currentPromotion ? updatePromotionMutation : createPromotionMutation;
      const url = currentPromotion ? `/api/promotion/${currentPromotion.id}` : '/api/promotion';
      
      const result = await mutation.execute(formData, url);
      
      if (result) {
        if (currentPromotion) {
          // Update existing promotion
          setPromotions(prevPromotions => prevPromotions.map(p => p.id === currentPromotion.id ? result.data : p));
          viewContext.notification({
            description: t('promotions.promotion_updated'),
            variant: 'success'
          });
        } else {
          // Add new promotion
          setPromotions(prevPromotions => [result.data, ...prevPromotions]);
          viewContext.notification({
            description: t('promotions.promotion_created'),
            variant: 'success'
          });
        }
        
        setDialogOpen(false);
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      viewContext.notification({
        description: t('promotions.error_saving'),
        variant: 'error'
      });
    }
  }, [currentPromotion, viewContext, t, createPromotionMutation, updatePromotionMutation]);

  // delete promotion
  const deletePromotion = useCallback((promotion) => {
    viewContext.dialog.open({
      title: t('promotions.confirm_delete'),
      description: `${t('promotions.confirm_delete')} "${promotion.startDate} - ${promotion.endDate}"?`,
      form: {
        inputs: false,
        buttonText: t('promotions.delete'),
        url: `/api/promotion/${promotion.id}`,
        method: 'DELETE',
        destructive: true
      }
    }, (res, data) => {
      // Use functional update to avoid stale 'promotions'
      setPromotions(prevPromotions => prevPromotions.filter(p => p.id !== promotion.id));
      viewContext.notification({
        description: t('promotions.promotion_deleted'),
        variant: 'success'
      });
    });
  }, [viewContext, t]);

  // format promotions data for table
  const tableData = promotions.map(promotion => {
    // Handle both old format (array of IDs) and new format (array of objects)
    const gamesObjects = promotion.games?.map(game => {
      if (typeof game === 'object' && game.gameCmsId) {
        // New format: object with gameCmsId
        return games?.find(g => g.cmsId === game.gameCmsId);
      } else {
        // Old format: string ID, try to find game
        const gameObj = games?.find(g => g.id === game);
        return gameObj;
      }
    }) || [];
    
    // Create a custom component for games column with badges
    const gamesComponent = gamesObjects.length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {gamesObjects.map((gameObject, index) => (
          <Badge key={index} variant="blue" className="text-xs">
            {gameObject.friendlyName}
          </Badge>
        ))}
      </div>
    ) : (
      <span className="text-muted-foreground text-sm">{t('promotions.no_games_selected')}</span>
    );
    
    // Format dates with times
    const startDateStr = new Date(promotion.startDate).toLocaleDateString();
    const endDateStr = new Date(promotion.endDate).toLocaleDateString();
    const startTimeStr = promotion.startTime ? formatTime(promotion.startTime) : '';
    const endTimeStr = promotion.endTime ? formatTime(promotion.endTime) : '';
    
    // Combine date and time for display (e.g., "Jan 15, 2024 6h30 AM")
    const startDateTime = startTimeStr ? `${startDateStr} at ${startTimeStr}` : startDateStr;
    const endDateTime = endTimeStr ? `${endDateStr} at ${endTimeStr}` : endDateStr;
    
    return {
      ...promotion,
      published: promotion.published || false,
      name: promotion.name || '',
      description: promotion.description || '',
      group: promotion.group || '',
      startDate: startDateTime,
      endDate: endDateTime,
      games: gamesComponent
    };
  });

  const actions = [
    {
      label: t('promotions.edit'),
      icon: 'pencil',
      globalOnly: false,
      action: ({ row }) => {
        // Use original promotion from promotions array instead of transformed row
        const originalPromotion = promotions.find(p => p.id === row.id);
        if (originalPromotion) {
          editPromotion(originalPromotion);
        }
      }
    },
    {
      label: t('promotions.delete'),
      icon: 'trash-2',
      globalOnly: false,
      action: ({ row }) => deletePromotion(row)
    }
  ];

  return (
    <Animate>
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('promotions.promotions')}</h1>
          <Button 
            color="green"
            text={t('promotions.create_promotion')}
            onClick={createPromotion}
            icon="plus"
          />
        </div>

        {promotions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('promotions.no_promotions')}
          </div>
        ) : (
          <Table
            data={tableData}
            actions={actions}
            show={['published', 'name', 'description', 'group', 'startDate', 'endDate', 'games', 'approvedBy']}
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
        )}
      
      </Card>

      {/* Promotion Configuration Dialog */}
      <PromotionConfigurationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        games={games}
        selectedGames={selectedGames}
        setSelectedGames={setSelectedGames}
        promotion={currentPromotion}
        t={t}
        onSubmit={handleFormSubmit}
      />
    </Animate>
  );
}