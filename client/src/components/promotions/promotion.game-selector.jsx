import { useState, useEffect, useRef } from 'react';
import { Input, Icon, cn, Card, useNavigate } from 'components/lib';
import MediaPlayer from '../edit/MediaPlayer';

const PromotionGameSelector = ({ 
  games = [], 
  selectedGames: propSelectedGames = [],
  onSelectionChange,
  onMissingAssetsChange,
  onClose
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredGames, setFilteredGames] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedGames, setSelectedGames] = useState([]);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const isInternalUpdateRef = useRef(false);
  const prevPropSelectedGamesRef = useRef(null);
  const propSelectedGamesRef = useRef(propSelectedGames);
  const onSelectionChangeRef = useRef(onSelectionChange);

  // Update refs whenever props change
  useEffect(() => {
    propSelectedGamesRef.current = propSelectedGames;
  }, [propSelectedGames]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // Helper to compare arrays
  const arraysEqual = (a, b) => {
    if (!a || !b) return a === b;
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  };

  // Initialize: Map selectedGames IDs prop to full game objects on mount/update
  // Only update if propSelectedGames IDs actually changed (and not from internal update)
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const propIds = Array.isArray(propSelectedGames) ? propSelectedGames : [];
    const prevIds = prevPropSelectedGamesRef.current;
    
    // If games are loaded and we have prop IDs
    if (games.length > 0 && propIds.length > 0) {
      // Check if IDs changed
      const idsChanged = prevIds === null || !arraysEqual(propIds, prevIds);
      
      // Initialize if IDs changed
      if (idsChanged) {
        const selectedGameObjects = games.filter(game => 
          propIds.includes(game.id)
        );
        setSelectedGames(selectedGameObjects);
        prevPropSelectedGamesRef.current = propIds;
      }
    } else if (propIds.length > 0) {
      // Store prop IDs for when games load
      if (prevIds === null || !arraysEqual(propIds, prevIds)) {
        prevPropSelectedGamesRef.current = propIds;
      }
    } else if (propIds.length === 0 && prevIds !== null && prevIds.length > 0) {
      // Prop IDs cleared - clear selection and reset ref
      setSelectedGames([]);
      prevPropSelectedGamesRef.current = null;
    } else if (prevPropSelectedGamesRef.current === null && propIds.length === 0) {
      // Initial mount with empty selection
      prevPropSelectedGamesRef.current = [];
    }
  }, [propSelectedGames, games]);

  // Sync with parent: Convert selected game objects to IDs array and call onSelectionChange
  // Only sync when internal state changes (not from prop updates)
  useEffect(() => {
    if (!onSelectionChangeRef.current || isInternalUpdateRef.current) return;
    
    const currentIds = selectedGames.map(game => game.id);
    const propIds = Array.isArray(propSelectedGamesRef.current) ? propSelectedGamesRef.current : [];
    
    // Only call onSelectionChange if IDs actually differ from prop
    if (!arraysEqual(currentIds, propIds)) {
      isInternalUpdateRef.current = true;
      onSelectionChangeRef.current(currentIds);
    }
  }, [selectedGames]);

  // Check for missing assets and notify parent
  useEffect(() => {
    if (!onMissingAssetsChange) return;
    
    const gamesWithMissingAssets = selectedGames.filter(game => {
      return !game.promoImage || !game.promoVideo;
    });
    
    onMissingAssetsChange(gamesWithMissingAssets.length > 0, gamesWithMissingAssets);
  }, [selectedGames, onMissingAssetsChange]);

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
    // Prevent duplicate selections
    const isAlreadySelected = selectedGames.some(
      selected => selected.id === game.id
    );
    
    if (!isAlreadySelected) {
      const newSelectedGames = [...selectedGames, game];
      setSelectedGames(newSelectedGames);
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
    const value = event.target.value;
    setSearchQuery(value);
    setIsDropdownOpen(value.length > 0);
  };

  // Handle input focus
  const handleInputFocus = () => {
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

  // Handle delete game
  const handleDeleteGame = (gameId) => {
    setSelectedGames(prev => prev.filter(game => game.id !== gameId));
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

  // Get media type for a game - always use 'both'
  const getMediaType = () => {
    return 'both';
  };

  // Get image URL for a game - only use promoImage
  const getImageUrl = (game) => {
    return game.promoImage || null;
  };

  // Get video URL for a game - only use promoVideo
  const getVideoUrl = (game) => {
    return game.promoVideo || null;
  };

  // Check if a game has missing assets
  const hasMissingAssets = (game) => {
    return !game.promoImage || !game.promoVideo;
  };

  // Handle edit game navigation
  const handleEditGame = (gameId) => {
    if (onClose) {
      onClose();
    }
    navigate(`/edit/${gameId}`);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Search Input - Fixed at top */}
      <div className="flex-shrink-0 pb-4 ">
        <div className="relative flex flex-row justify-center items-center">
          <Input
            ref={inputRef}
            name="game-search"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder="Search games by ID, CMS ID, or Name..."
            className="w-[99%] pl-10 pr-4"
          />
          <Icon
            name="search"
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
          />
        </div>

        {/* Dropdown */}
        {isDropdownOpen && filteredGames.length > 0 && (
          <div
            ref={dropdownRef}
            className={cn(
              'absolute z-50 w-full mt-1 bg-white dark:bg-slate-800',
              'border border-slate-200 dark:border-slate-700 rounded-md shadow-lg',
              'max-h-60 overflow-y-auto',
              'transition-all duration-200 ease-in-out',
              'w-1/3',
              'opacity-100 scale-100'
            )}
          >
            {filteredGames.map((game, index) => {
              const isAlreadySelected = selectedGames.some(
                selected => selected.id === game.id
              );
              
              return (
                <div
                  key={game.id}
                  onClick={() => !isAlreadySelected && handleGameSelect(game)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 cursor-pointer',
                    'transition-colors duration-150',
                    isAlreadySelected 
                      ? 'bg-slate-200 dark:bg-slate-600 opacity-60 cursor-not-allowed' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700',
                    highlightedIndex === index && !isAlreadySelected && 'bg-slate-100 dark:bg-slate-700'
                  )}
                >
                  <img src={game?.defaultImage || ''} alt={game.cmsId} width={48} height={56} className="text-slate-500 dark:text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {game.friendlyName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      ID: {game.id}
                    </div>
                  </div>
                  {isAlreadySelected && (
                    <Icon
                      name="check"
                      size={14}
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

      {/* Selected Games Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {selectedGames.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Selected Games ({selectedGames.length})
            </div>
            <div className="flex flex-wrap gap-4">
              {selectedGames.map((game) => {
                const gameHasMissingAssets = hasMissingAssets(game);
                
                return (
                <div
                  key={game.id}
                  className="relative group"
                >
                  {/* Action Buttons - Always visible */}
                  <div className="absolute -top-2 -right-2 z-20 flex gap-1">
                    <button
                      onClick={() => handleEditGame(game.id)}
                      className={cn(
                        'w-7 h-7 rounded-md',
                        'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
                        'flex items-center justify-center',
                        'transition-all duration-200',
                        'shadow-md hover:shadow-lg',
                        'border border-blue-400/30',
                        'hover:scale-105 active:scale-95'
                      )}
                      aria-label={`Edit ${game.cmsId}`}
                    >
                      <Icon
                        name="pencil"
                        size={14}
                        className="text-white"
                      />
                    </button>
                    <button
                      onClick={() => handleDeleteGame(game.id)}
                      className={cn(
                        'w-7 h-7 rounded-md',
                        'bg-red-500 hover:bg-red-600 active:bg-red-700',
                        'flex items-center justify-center',
                        'transition-all duration-200',
                        'shadow-md hover:shadow-lg',
                        'border border-red-400/30',
                        'hover:scale-105 active:scale-95'
                      )}
                      aria-label={`Remove ${game.cmsId}`}
                    >
                      <Icon
                        name="x"
                        size={14}
                        className="text-white"
                      />
                    </button>
                  </div>

                  {/* Game Title */}
                  

                  {/* MediaPlayer */}
                  <div className="w-[220px]">
                    <MediaPlayer
                      gameId={game.id}
                      imageUrl={getImageUrl(game)}
                      videoUrl={getVideoUrl(game)}
                      type={'both'}
                      readOnly={false}
                      canSelect={false}
                      showPlayIcon={true}
                    />
                    <div className="mt-2 text-center">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {game.friendlyName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        ID: {game.id}
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedGames.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Icon name="gamepad-2" size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No games selected. Search and select games above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionGameSelector;
