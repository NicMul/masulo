/***
*
*   THEME SELECT
*   Reusable theme selection dropdown component
*
*   PROPS
*   className: custom styling (string, optional)
*   error: error state (boolean, optional)
*   register: react-hook-form register function (function, optional)
*   required: validation rules (object, optional)
*   value: controlled value (string, optional)
*   onChange: change handler (function, optional)
*   name: input name (string, optional)
*
**********/

import { forwardRef } from 'react';
import { cn } from 'components/lib';

// Theme options available across the application
export const THEME_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'xmas', label: 'Christmas' },
  { value: 'valentines', label: 'Valentines' },
  { value: 'halloween', label: 'Halloween' },
  { value: 'easter', label: 'Easter' },
  { value: 'stpatricks', label: "St Patrick's Day" }
];

export const ThemeSelect = forwardRef(({ 
  className, 
  error, 
  ...props 
}, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
        error ? "border-red-300" : "border-gray-300",
        className
      )}
      {...props}
    >
      {THEME_OPTIONS.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

ThemeSelect.displayName = 'ThemeSelect';

