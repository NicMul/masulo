/***
*
*   PROMOTION CONFIGURATION DIALOG
*   A combined dialog for creating/editing promotions with form on left and games selection on right
*
**********/

import { useState, useCallback, useEffect, useRef } from 'react';
import { Table, Dialog, Button } from 'components/lib';

// UTILITY: Function to format dates for HTML input type="date" (YYYY-MM-DD format)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    // Handle DD/MM/YYYY format from backend
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    // Handle standard ISO date format
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Invalid date string provided:", dateString);
    return '';
  }
};

export function PromotionConfigurationDialog({ 
  open,
  onClose,
  games = [], 
  selectedGames = [], 
  setSelectedGames,
  promotion = null, // null for create, object for edit
  t,
  onSubmit
}) {
  const [tableSelected, setTableSelected] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    approvedBy: ''
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const formRef = useRef(null);

  // Initialize form data when promotion changes
  useEffect(() => {
    if (promotion) {
      const formattedStartDate = formatDateForInput(promotion.startDate);
      const formattedEndDate = formatDateForInput(promotion.endDate);
      
      setFormData({
        name: promotion.name || '',
        description: promotion.description || '',
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        approvedBy: promotion.approvedBy || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        approvedBy: ''
      });
    }
  }, [promotion]);

  // Initialize table selection when selectedGames changes
  useEffect(() => {
    // Ensure selectedGames is always an array
    const gamesArray = Array.isArray(selectedGames) ? selectedGames : [];
    
    if (gamesArray.length > 0 && games.length > 0) {
      const selectedGameObjects = games.filter(game => gamesArray.includes(game.id));
      setTableSelected(selectedGameObjects);
    } else {
      setTableSelected([]);
    }
  }, [selectedGames, games]);

  // Validate form whenever form data changes
  useEffect(() => {
    const validateForm = () => {
      const { name, description, startDate, endDate, approvedBy } = formData;
      
      // Check if required fields are filled
      if (!name || !description || !startDate || !endDate) {
        return false;
      }
      
      // Check if end date is after start date
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return false;
      }
      
      // Check if at least one game is selected - ensure selectedGames is an array
      const gamesArray = Array.isArray(selectedGames) ? selectedGames : [];
      if (gamesArray.length === 0) {
        return false;
      }
      
      // Check if approvedBy is provided
      if (!approvedBy || approvedBy.trim() === '') {
        return false;
      }
      
      return true;
    };
    
    setIsFormValid(validateForm());
  }, [formData, selectedGames]);

  // Handle form field changes
  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle selection changes from table
  const handleSelectionChange = useCallback((selectedRows) => {
    setTableSelected(selectedRows);
    const selectedGameIds = selectedRows.map(row => row.id);
    setSelectedGames(selectedGameIds);
  }, [setSelectedGames]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!isFormValid) {
      return;
    }
    
    // Ensure selectedGames is always an array
    const gamesArray = Array.isArray(selectedGames) ? selectedGames : [];
    
    const data = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      games: gamesArray,
      approvedBy: formData.approvedBy.trim()
    };
    
    onSubmit(data);
  }, [formData, selectedGames, isFormValid, onSubmit]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // Format games data for table
  const tableData = games.map(game => ({
    id: game.id,
    cmsId: game.cmsId,
    defaultImage: game.defaultImage,
    currentImage: game.currentImage,
    themeImage: game.themeImage,
    hover: game.hover,
    animated: game.animate
  }));

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      title={promotion ? t('promotions.edit_promotion') : t('promotions.create_promotion')}
      className="max-w-[90vw] w-full max-h-[90vh] overflow-hidden"
    >
      <div className="flex flex-col h-[80vh]">
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left side - Form */}
          <div className="w-[30%] min-w-0">
            <form ref={formRef} className="space-y-4 h-full overflow-y-auto p-2">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('promotions.name')} *</label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !formData.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('promotions.name')}
                  required
                />
                {!formData.name && (
                  <p className="text-red-500 text-xs mt-1">{t('promotions.name_required')}</p>
                )}
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('promotions.description')} *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !formData.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('promotions.description')}
                  rows={3}
                  required
                />
                {!formData.description && (
                  <p className="text-red-500 text-xs mt-1">{t('promotions.description_required')}</p>
                )}
              </div>
              
              {/* Date Fields Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('promotions.start_date')} *</label>
                  <input
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFormChange('startDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !formData.startDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {!formData.startDate && (
                    <p className="text-red-500 text-xs mt-1">{t('promotions.start_date_required')}</p>
                  )}
                </div>
                
                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('promotions.end_date')} *</label>
                  <input
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFormChange('endDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !formData.endDate || (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) 
                        ? 'border-red-300' 
                        : 'border-gray-300'
                    }`}
                    required
                  />
                  {!formData.endDate && (
                    <p className="text-red-500 text-xs mt-1">{t('promotions.end_date_required')}</p>
                  )}
                  {formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate) && (
                    <p className="text-red-500 text-xs mt-1">{t('promotions.end_date_after_start')}</p>
                  )}
                </div>
              </div>
              
              {/* Selected Games Summary */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('promotions.games')} *</label>
                <div className={`p-3 border rounded-md min-h-[60px] ${
                  !selectedGames || !Array.isArray(selectedGames) || selectedGames.length === 0 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  {Array.isArray(selectedGames) && selectedGames.length > 0 ? (
                    <div>
                      <div className="text-sm font-medium mb-2">
                        {selectedGames.length} games selected
                      </div>
                      <div className="text-xs text-gray-600">
                        {selectedGames.map(gameId => {
                          const game = games.find(g => g.id === gameId);
                          return game ? game.cmsId : gameId;
                        }).join(', ')}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-500">No games selected</div>
                  )}
                </div>
                {(!selectedGames || !Array.isArray(selectedGames) || selectedGames.length === 0) && (
                  <p className="text-red-500 text-xs mt-1">{t('promotions.games_required')}</p>
                )}
              </div>
              
              {/* Approved By */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('promotions.approved_by')} *</label>
                <input
                  name="approvedBy"
                  type="text"
                  value={formData.approvedBy}
                  onChange={(e) => handleFormChange('approvedBy', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !formData.approvedBy || formData.approvedBy.trim() === '' ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {(!formData.approvedBy || formData.approvedBy.trim() === '') && (
                  <p className="text-red-500 text-xs mt-1">{t('promotions.approved_by_required')}</p>
                )}
              </div>
            </form>
          </div>

          {/* Right side - Games Selection Table */}
          <div className="w-[70%] min-w-0 flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
              <h3 className="text-lg font-medium">{t('promotions.select_games')}</h3>
              <div className="text-sm text-muted-foreground">
                {tableSelected.length} of {games.length} games selected
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <Table
                data={tableData}
                show={['cmsId', 'defaultImage', 'currentImage', 'themeImage', 'hover', 'animated']}
                selectable={true}
                searchable={true}
                onSelectionChange={handleSelectionChange}
                badge={[
                  {
                    col: 'hover',
                    color: 'default',
                    condition: [
                      { value: true, color: 'green' },
                      { value: false, color: 'destructive' }
                    ]
                  },
                  {
                    col: 'animated',
                    color: 'default',
                    condition: [
                      { value: true, color: 'green' },
                      { value: false, color: 'destructive' }
                    ]
                  }
                ]}
                className="h-full"
              />
            </div>
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button
            text={t('promotions.cancel')}
            onClick={handleCancel}
            variant="outline"
          />
          <Button
            text={promotion ? t('promotions.save') : t('promotions.create_promotion')}
            onClick={handleSubmit}
            icon="check"
            disabled={!isFormValid}
          />
        </div>
      </div>
    </Dialog>
  );
}
