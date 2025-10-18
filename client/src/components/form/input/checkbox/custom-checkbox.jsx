/***
*
*   CUSTOM CHECKBOX GROUP
*   Checkbox group that supports value/label pairs for better UX
*
**********/

import { forwardRef } from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Icon, cn } from 'components/lib';

const CustomCheckboxGroup = forwardRef(({ className, options, onChange, checked, name, defaultValue, value, ...props }, ref) => {
  
  function handleChange(optionValue, checked){
    const currentValue = value || [];
    
    if (checked) {
      // Add to selection if not already present
      if (!currentValue.includes(optionValue)) {
        const newValue = [...currentValue, optionValue];
        onChange({ target: { name: name, value: newValue }, type: 'change'});
      }
    } else {
      // Remove from selection
      const newValue = currentValue.filter(v => v !== optionValue);
      onChange({ target: { name: name, value: newValue }, type: 'change'});
    }
  }

  return (
    <fieldset ref={ ref } className={ cn('flex flex-col items-start gap-2', className) } {...props }>

      { options?.length &&
        options.map(option => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          const isChecked = (value || []).includes(optionValue);
          
          return (
            <div key={ optionValue } className='flex items-center mb-2'>
              <CheckboxPrimitive.Root 
                checked={ isChecked }
                onCheckedChange={ (checked) => handleChange(optionValue, checked) }
                className={ cn('peer h-4 w-4 shrink-0 rounded-sm border border-slate-200 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-slate-900 data-[state=checked]:text-slate-50 dark:border-slate-800 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:data-[state=checked]:bg-slate-50 dark:data-[state=checked]:text-slate-900') }>

                <CheckboxPrimitive.Indicator className='flex items-center justify-center text-current'>
                  <Icon name='check' className={ 'h-4 w-4' } />
                </CheckboxPrimitive.Indicator>
              </CheckboxPrimitive.Root>

              <label className='font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ml-2'>
                { optionLabel }
              </label>
            </div>
          )
        })}

    </fieldset>
  );
})

CustomCheckboxGroup.displayName = 'CustomCheckboxGroup';
export { CustomCheckboxGroup }
