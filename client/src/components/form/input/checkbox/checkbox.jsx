/***
*
*   CHECKBOX GROUP
*   Allows the user to toggle between checked and not checked. 
*   One or multiple checkbox inputs supported.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/form
*   https://ui.shadcn.com/docs/components/checkbox
*
*   PROPS
*   aria-describedby: id of the element that describes the input in ...props (string, optional)
*   aria-invalid: determines if the input is invalid in ...props (boolean, required)
*   className: custom styling (SCSS or tailwind style, optional)
*   defaultValue: initial selected value(s) (array, optional)
*   name: input name (string, required)
*   onChange: callback (function, required)
*   options: [string] (array, required)
*   value: the current value (string, required)
*
**********/

import { forwardRef } from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Icon, cn } from 'components/lib';

const CheckboxGroup = forwardRef(({ className, options, onChange, checked, name, defaultValue, value, ...props }, ref) => {
  
  function handleChange(option){

    const key = Object.keys(option)[0];
    const selected = Object.keys(option).find(key => option[key]);

    selected ? 
      (value?.length ? value.push(selected) : value = [selected]) :
      value.splice(value.indexOf(key), 1);
      
    onChange({ target: { name: name, value: value }, type: 'change'});

  }

  return (
    <fieldset ref={ ref } className={ cn('flex flex-col items-start gap-2', className) } {...props }>

      { options?.length &&
        options.map(option => {
          return (
            <Checkbox 
              onChange={ handleChange } 
              label={ option } 
              key={ option }
              name={ name }
              checked={ checked }
              value={ value }
              defaultChecked={ defaultValue?.includes(option) }
            />
          )
        })}

    </fieldset>
  );
})

CheckboxGroup.displayName = 'CheckboxGroup';

const Checkbox = forwardRef(({ className, name, onChange, checked, defaultChecked, value, defaultValue, required, label }, ref) => {
  
  return (
    <div className='flex items-center mb-2'>
      <CheckboxPrimitive.Root 
        ref={ ref } 
        defaultValue={ defaultValue }
        value={ value }
        name={ name }
        required={ required }
        checked={ checked }
        defaultChecked={ defaultChecked }
        className={ cn('peer h-4 w-4 shrink-0 rounded-sm border border-slate-200 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-slate-900 data-[state=checked]:text-slate-50 dark:border-slate-800 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:data-[state=checked]:bg-slate-50 dark:data-[state=checked]:text-slate-900', className) } 
        onCheckedChange={ value => onChange({ [label]: value })}>

        <CheckboxPrimitive.Indicator className='flex items-center justify-center text-current'>

          <Icon name='check' className={ 'h-4 w-4' } />

        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>

      <label htmlFor={ name } className='font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ml-2'>
        { label }
      </label>

    </div>
  );
});

Checkbox.displayName = CheckboxPrimitive.Root.displayName
export { Checkbox, CheckboxGroup }