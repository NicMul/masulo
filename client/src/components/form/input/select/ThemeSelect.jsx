/***
*
*   THEME SELECT
*   Reusable theme selection dropdown component that fetches themes from API
*
*   PROPS
*   className: custom styling (string, optional)
*   error: error state (boolean, optional)
*   register: react-hook-form register function (function, optional)
*   required: validation rules (object, optional)
*   value: controlled value (string, optional)
*   onChange: change handler (function, optional)
*   name: input name (string, optional)
*   placeholder: placeholder text (string, optional)
*
**********/

import { forwardRef, useState, useEffect } from 'react';
import { cn, useAPI } from 'components/lib';

// Fallback theme options if API fails
export const FALLBACK_THEME_OPTIONS = [
  { id: 'default', friendlyName: 'Default' },
  { id: 'xmas', friendlyName: 'Christmas' },
  { id: 'valentines', friendlyName: 'Valentines' },
  { id: 'halloween', friendlyName: 'Halloween' },
  { id: 'easter', friendlyName: 'Easter' },
  { id: 'stpatricks', friendlyName: "St Patrick's Day" }
];

export const ThemeSelect = forwardRef(({ 
  className, 
  error, 
  placeholder = "Select a theme",
  ...props 
}, ref) => {
  
  // Fetch themes from API
  const themesRes = useAPI('/api/theme');
  const [themes, setThemes] = useState([]);

  // Update themes when data loads
  useEffect(() => {
    if (themesRes.data) {
      setThemes(themesRes.data);
    }
  }, [themesRes.data]);

  // Use API themes if available, otherwise fallback to hardcoded options
  const themeOptions = themes.length > 0 ? themes : FALLBACK_THEME_OPTIONS;

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
      <option value="">{placeholder}</option>
      {themeOptions.map(option => (
        <option key={option.id || option.value} value={option.friendlyName || option.label}>
          {option.friendlyName || option.label}
        </option>
      ))}
      {themes.length === 0 && (
        <option value="" disabled>
          No Themes Configured
        </option>
      )}
    </select>
  );
});

ThemeSelect.displayName = 'ThemeSelect';

