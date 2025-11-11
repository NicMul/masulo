/***
*
*   SEARCH
*   Search input field.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/search
*
*   PROPS
*   callback: executed on change and submit (function, required)
*   className: custom styling (SCSS or tailwind style, optional)
*   placeholder: placeholder text (string, optional, default: Search)
*   throttle: throttle the callback execution in ms (integer, required)
*   value: current value in ...props (string, optional)
*
**********/

import { useState, useEffect, useCallback } from 'react';
import { Input, useTranslation, debounce, cn } from 'components/lib';

export function Search({ className, placeholder, throttle, callback, ...props }){

  const { t } = useTranslation();
  const [value, setValue] = useState(props.value || '');
  const debouncedCallback = useCallback(debounce(callback, throttle), [callback, throttle]);
  
  useEffect(() => {

    if (!throttle) return;
    debouncedCallback(value);
    return () => debouncedCallback.cancel && debouncedCallback.cancel();

  }, [value, debouncedCallback, throttle]);

  return (
    <form className={ cn('w-full', className) }>

      <Input
        type='search'
        value={ value }
        placeholder={ placeholder || t('global.search') } 
        onChange={ e => {

          setValue(e.target.value);
          !throttle && callback(e.target.value);

        }}
      />

    </form>
  );
}