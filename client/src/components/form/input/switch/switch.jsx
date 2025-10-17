/***
*
*   SWITCH
*   Switch control that allows the user to toggle between checked and not checked.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/form
*   https://ui.shadcn.com/docs/components/switch
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   label: input label (string, optional)
*   name: input name (string, required)
*   onChange: callback (function, required)
*   value: input value (string, optional)
*
**********/

import { forwardRef } from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from 'components/lib';

const Switch = forwardRef(({ className, name, label, value, onChange, ...props }, ref) => {
  
  delete props.type; // delete or switch will submit the form

  return (
    <div className='flex items-center'>

      <SwitchPrimitives.Root
        ref={ ref } 
        checked={ value }
        className={ cn('peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-slate-700 data-[state=unchecked]:bg-slate-200 dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-slate-950 dark:data-[state=checked]:bg-slate-50 dark:data-[state=unchecked]:bg-slate-600', className) } {...props } 
        onCheckedChange={ value => onChange({ target: { name, value }, type: 'change' })}> 

        <SwitchPrimitives.Thumb className='pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 dark:bg-slate-950'/>

      </SwitchPrimitives.Root>

      { label && 
        <label htmlFor={ name } className='font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ml-2'>
          { label }
        </label> 
      }
      
    </div>
  );
});

Switch.displayName = SwitchPrimitives.Root.displayName
export { Switch }
