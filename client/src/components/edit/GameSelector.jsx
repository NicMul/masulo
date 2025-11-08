/***
*
*   GAME SELECTOR COMPONENT
*   Handles game selection with searchable input and dynamic dropdown
*
**********/

import { useState, useEffect, useRef } from 'react';
import { Card, Input, Icon, cn } from 'components/lib';

export function GameSelector({ t, onGameSelect, games = [], selectedGame: propSelectedGame, disabled = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredGames, setFilteredGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(propSelectedGame);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const isInternalUpdate = useRef(false);

  // Close dropdown when disabled
  useEffect(() => {
    if (disabled) {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  }, [disabled]);

  // Update internal state when prop changes
  useEffect(() => {
    // Don't override user input during internal updates
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    
    if (propSelectedGame) {
      setSelectedGame(propSelectedGame);
      setSearchQuery(propSelectedGame.friendlyName || '');
    } else {
      setSelectedGame(null);
      setSearchQuery('');
    }
  }, [propSelectedGame]);

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
    if (disabled) return;
    setSelectedGame(game);
    setSearchQuery(game.friendlyName || '');
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    onGameSelect(game);
  };

  // Handle input change
  const handleInputChange = (event) => {
    if (disabled) return;
    const value = event.target.value;
    setSearchQuery(value);
    setIsDropdownOpen(value.length > 0);
    
    // Clear selection if input doesn't match selected game
    if (selectedGame && value !== selectedGame.friendlyName) {
      isInternalUpdate.current = true;
      setSelectedGame(null);
      onGameSelect(null);
    }
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
    if (disabled) return;
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
    <Card>
      <div className='space-y-4'>
        <div className='w-1/4'>
          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
            { t('edit.game.select.label') }
          </label>
          
          <div className='relative'>
            <div className='relative'>
              <Input
                ref={inputRef}
                name='game'
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleKeyDown}
                placeholder={ t('edit.game.select.placeholder') }
                className={cn('w-full pl-10 pr-4', disabled && 'cursor-not-allowed opacity-60')}
                disabled={disabled}
              />
              <Icon
                name='search'
                size={16}
                className={cn('absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400', disabled && 'opacity-60')}
              />
            </div>

            {/* Dropdown */}
            {!disabled && isDropdownOpen && filteredGames.length > 0 && (
              <div
                ref={dropdownRef}
                className={cn(
                  'absolute z-50 w-full mt-1 bg-white dark:bg-slate-800',
                  'border border-slate-200 dark:border-slate-700 rounded-md shadow-lg',
                  'max-h-60 overflow-y-auto',
                  'transition-all duration-200 ease-in-out',
                  'opacity-100 scale-100'
                )}
              >
                {filteredGames.map((game, index) => (
                  <div
                    key={game.id}
                    onClick={() => handleGameSelect(game)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 cursor-pointer',
                      'transition-colors duration-150',
                      'hover:bg-slate-100 dark:hover:bg-slate-700',
                      highlightedIndex === index && 'bg-slate-100 dark:bg-slate-700',
                      selectedGame?.id === game.id && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                   <img src={game?.defaultImage || ''} alt={game.cmsId} width={48} height={56} className="text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    <div className='flex-1 min-w-0'>
                      <div className='text-sm font-medium text-slate-900 dark:text-slate-100 truncate'>
                        {game.friendlyName}
                      </div>
                      <div className='text-xs text-slate-500 dark:text-slate-400'>
                        ID: {game.id}
                      </div>
                    </div>
                    {selectedGame?.id === game.id && (
                      <Icon
                        name='check'
                        size={14}
                        className='text-blue-600 dark:text-blue-400 flex-shrink-0'
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* No results message */}
            {!disabled && isDropdownOpen && searchQuery.length > 0 && filteredGames.length === 0 && (
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
      </div>
    </Card>
  );
}
