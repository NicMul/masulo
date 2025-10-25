/***
*
*   BULK ACTIONS DIALOG
*   Comprehensive dialog for performing bulk actions on selected games
*   Shows all editable fields in one form with game ID chips and inline warnings
*
**********/

import { useState, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Icon, ViewContext, Switch, GroupSelect, ThemeSelect, cn } from 'components/lib';

export function BulkActionsDialog({ isOpen, onClose, selectedGames, onApplyChanges, t }) {
  const viewContext = useContext(ViewContext);
  
  // Form state
  const [published, setPublished] = useState(null); // null = no change, true/false = set value
  const [group, setGroup] = useState('');
  const [theme, setTheme] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  
  // Calculate warnings
  const publishedCount = selectedGames.filter(g => g.published).length;
  const unpublishedCount = selectedGames.filter(g => !g.published).length;
  
  // Determine what changes will be made
  const changes = [];
  if (published !== null) {
    changes.push(`${published ? 'Publish' : 'Unpublish'}: ${selectedGames.length} games`);
  }
  if (group) {
    changes.push(`Group: ${selectedGames.length} games`);
  }
  if (theme) {
    changes.push(`Theme: ${selectedGames.length} games`);
  }
  
  const hasChanges = changes.length > 0;
  
  const handleApply = async () => {
    if (!hasChanges) return;
    
    setIsApplying(true);
    try {
      const changes = {};
      if (published !== null) changes.published = published;
      if (group) changes.group = group;
      if (theme) changes.theme = theme;
      
      await onApplyChanges(changes);
      onClose();
    } finally {
      setIsApplying(false);
    }
  };
  
  const resetForm = () => {
    setPublished(null);
    setGroup('');
    setTheme('');
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('games.bulk.title')}</DialogTitle>
          <DialogDescription>
            {t('games.bulk.selected', { count: selectedGames.length })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Game ID Chips */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Games to Edit
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
              {selectedGames.map((game, index) => (
                <span
                  key={game.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {game.cmsId}
                </span>
              ))}
            </div>
          </div>
          
          {/* Published Toggle */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Published Status
            </label>
            <div className="flex items-center space-x-3">
              <Switch
                name="published"
                value={published === true}
                onChange={(e) => setPublished(e.target.value ? true : false)}
              />
              <span className="text-sm text-gray-600">
                {published === true ? 'Publish all games' : 'Unpublish all games'}
              </span>
            </div>
            {published !== null && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  This will {published ? 'publish' : 'unpublish'} {selectedGames.length} games on your live application.
                </p>
              </div>
            )}
          </div>
          
          {/* Group Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {t('games.bulk.group.action')}
            </label>
            <GroupSelect
              name="group"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="Keep current group"
            />
            {group && publishedCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  Changing group will affect {publishedCount} published games on your live application.
                </p>
              </div>
            )}
          </div>
          
          {/* Theme Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {t('games.bulk.theme.action')}
            </label>
            <ThemeSelect
              name="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            />
            {theme && publishedCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  Changing theme will affect {publishedCount} published games on your live application.
                </p>
              </div>
            )}
          </div>
          
          {/* Changes Summary */}
          {hasChanges && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Changes to Apply:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {changes.map((change, index) => (
                  <li key={index} className="flex items-center">
                    <Icon name="check" className="w-4 h-4 mr-2" />
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isApplying}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            disabled={!hasChanges || isApplying}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isApplying && (
              <Icon name="loader-2" className="mr-2 h-4 w-4 animate-spin" />
            )}
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
