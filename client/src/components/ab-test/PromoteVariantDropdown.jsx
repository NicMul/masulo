/***
*
*   PROMOTE VARIANT DROPDOWN
*   Dropdown component for selecting promotion type (Current, Theme, Promotion)
*
**********/

import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuItem,
    Button,
    Icon
} from 'components/lib';

export const PromoteVariantDropdown = ({ value, onChange, highlightColor = "blue" }) => {
    const promotionOptions = [
     
        { value: 'current', label: 'Current' },
        { value: 'theme', label: 'Theme' },
        { value: 'promotion', label: 'Promotion' }
    ];

    const handleOptionClick = (optionValue) => {
        // If clicking the same option, deselect it
        if (value === optionValue) {
            onChange('');
        } else {
            onChange(optionValue);
        }
    };

    const highlightClass = highlightColor === "blue" 
        ? "bg-blue-50 dark:bg-blue-900/20" 
        : "bg-purple-50 dark:bg-purple-900/20";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-3"
                >
                    Use Variant
                    <Icon name="chevron-down" className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                {promotionOptions.map((option) => {
                    const isSelected = value === option.value;
                    return (
                        <DropdownMenuItem 
                            key={option.value}
                            onClick={() => handleOptionClick(option.value)}
                            className={isSelected ? highlightClass : ""}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span>{option.label}</span>
                                {isSelected && (
                                    <Icon name="check" className="h-4 w-4 ml-2" />
                                )}
                            </div>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

