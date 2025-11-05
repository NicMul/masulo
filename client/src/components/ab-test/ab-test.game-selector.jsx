import { useState, useEffect, useRef } from 'react';
import { Input, Icon, cn } from 'components/lib';

const ABTestGameSelector = ({ 
  games = [], 
  selectedGame = null,
  onSelectionChange,
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredGames, setFilteredGames] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filter games based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGames([]);
      return;
    }

    const filtered = games.filter(game => {
      const query = searchQuery.toLowerCase();
      const cmsId = game.cmsId?.toLowerCase() || '';
      const gameId = game.id?.toString().toLowerCase() || '';
      const friendlyName = game.friendlyName?.toLowerCase() || '';
      
      return cmsId.includes(query) || gameId.includes(query) || friendlyName.includes(query);
    });

    setFilteredGames(filtered);
    setHighlightedIndex(-1);
  }, [searchQuery, games]);

  // Handle game selection
  const handleGameSelect = (game) => {
    if (onSelectionChange) {
      onSelectionChange(game.id);
    }
    setSearchQuery('');
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle input change
  const handleInputChange = (event) => {
    if (disabled) return;
    const value = event.target.value;
    setSearchQuery(value);
    setIsDropdownOpen(value.length > 0);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (disabled) return;
    if (searchQuery.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (!isDropdownOpen || filteredGames.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredGames.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredGames.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0 && filteredGames[highlightedIndex]) {
          handleGameSelect(filteredGames[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Search Input - Fixed at top */}
      <div className="flex-shrink-0 pb-4">
        <div className="relative">
          <Input
            ref={inputRef}
            name="game-search"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Game selection locked for editing" : "Search games by ID, CMS ID, or Name..."}
            className="w-full pl-10 pr-4"
            disabled={disabled}
          />
          <Icon
            name="search"
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
          />

          {/* Dropdown */}
          {isDropdownOpen && filteredGames.length > 0 && (
            <div
              ref={dropdownRef}
              className={cn(
                'absolute z-50 w-full mt-1 bg-white dark:bg-slate-800',
                'border border-slate-200 dark:border-slate-700 rounded-md shadow-lg',
                'max-h-60 overflow-y-auto',
                'transition-all duration-200 ease-in-out'
              )}
            >
              {filteredGames.map((game, index) => {
                const isSelected = selectedGame?.id === game.id;
                
                return (
                  <div
                    key={game.id}
                    onClick={() => handleGameSelect(game)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 cursor-pointer',
                      'transition-colors duration-150',
                      'hover:bg-slate-100 dark:hover:bg-slate-700',
                      highlightedIndex === index && 'bg-slate-100 dark:bg-slate-700',
                      isSelected && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    <img 
                      src={game?.defaultImage || ''} 
                      alt={game.cmsId} 
                      width={48} 
                      height={56} 
                      className="flex-shrink-0 rounded object-cover" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {game.friendlyName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        ID: {game.id} | CMS: {game.cmsId}
                      </div>
                    </div>
                    {isSelected && (
                      <Icon
                        name="check"
                        size={18}
                        className="text-blue-600 dark:text-blue-400 flex-shrink-0"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* No results message */}
          {isDropdownOpen && searchQuery.length > 0 && filteredGames.length === 0 && (
            <div
              ref={dropdownRef}
              className={cn(
                'absolute z-50 w-full mt-1 bg-white dark:bg-slate-800',
                'border border-slate-200 dark:border-slate-700 rounded-md shadow-lg',
                'px-3 py-2 text-sm text-slate-500 dark:text-slate-400',
                'transition-all duration-200 ease-in-out'
              )}
            >
              No games found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Selected Game Display */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {selectedGame ? (
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Selected Game
            </div>
            <div 
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                "bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              )}
            >
              <img 
                src={selectedGame?.defaultImage || ''} 
                alt={selectedGame.cmsId} 
                width={64} 
                height={80} 
                className="flex-shrink-0 rounded object-cover" 
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {selectedGame.friendlyName}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  ID: {selectedGame.id}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  CMS ID: {selectedGame.cmsId}
                </div>
              </div>
              {!disabled && (
                <button
                  onClick={() => onSelectionChange && onSelectionChange(null)}
                  className={cn(
                    'p-2 rounded-md',
                    'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
                    'transition-colors duration-150'
                  )}
                  aria-label="Clear selection"
                >
                  <Icon name="x" size={18} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Icon name="dice-5" size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No game selected. Search and select a game above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ABTestGameSelector;

