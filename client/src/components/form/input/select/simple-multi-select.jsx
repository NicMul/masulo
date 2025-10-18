/***
*
*   SIMPLE MULTI SELECT
*   Simple multi-select using native HTML select with multiple attribute
*
**********/

import { forwardRef } from 'react'
import { cn, useTranslation } from 'components/lib';

const SimpleMultiSelect = forwardRef(({ className, options, onChange, defaultValue, placeholder, name, ...props }, ref) => {
  
  const { t } = useTranslation();

  const handleChange = (e) => {
    const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
    onChange({ target: { name, value: selectedValues }, type: 'change' });
  };

  return (
    <select
      ref={ref}
      name={name}
      multiple
      defaultValue={defaultValue}
      onChange={handleChange}
      className={cn(
        'flex h-20 w-full rounded-md border border-slate-200 bg-white px-3 py-2 ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300',
        className
      )}
      {...props}
    >
      {options?.length ? (
        options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))
      ) : (
        <option disabled>No options available</option>
      )}
    </select>
  );
});

SimpleMultiSelect.displayName = 'SimpleMultiSelect';
export { SimpleMultiSelect }
