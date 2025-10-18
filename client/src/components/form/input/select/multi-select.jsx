/***
*
*   MULTI SELECT
*   Multi-select dropdown component for selecting multiple options
*
**********/

import { forwardRef, useState } from 'react'
import { Button, Popover, PopoverContent, PopoverTrigger, Checkbox, Icon, cn, useTranslation } from 'components/lib';

const MultiSelect = forwardRef(({ className, options, onChange, defaultValue, placeholder, name, ...props }, ref) => {
  
  const { t } = useTranslation();
  const [selectedValues, setSelectedValues] = useState(defaultValue || []);
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    setSelectedValues(newValues);
    onChange({ target: { name, value: newValues }, type: 'change' });
  };

  const handleClear = () => {
    setSelectedValues([]);
    onChange({ target: { name, value: [] }, type: 'change' });
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder || t('global.form.select.placeholder');
    }
    
    if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option ? option.label : selectedValues[0];
    }
    
    return `${selectedValues.length} items selected`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          className={cn(
            'w-full justify-between text-left font-normal',
            !selectedValues.length && 'text-muted-foreground',
            className
          )}
          {...props}
        >
          <span className="truncate">{getDisplayText()}</span>
          <Icon name="chevron-down" className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-full p-0 z-[60]" align="start">
        <div className="max-h-60 overflow-auto">
          {options?.length ? (
            <div className="p-1">
              {options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm cursor-pointer"
                  onClick={() => handleToggle(option.value)}
                >
                  <Checkbox
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleToggle(option.value)}
                  />
                  <span className="text-sm">{option.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No options available
            </div>
          )}
        </div>
        
        {selectedValues.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="w-full text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});

MultiSelect.displayName = 'MultiSelect';
export { MultiSelect }
