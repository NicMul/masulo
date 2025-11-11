/***
*
*   RADIO GROUP
*   A set of checkable radio buttons — 
*   no more than one button can be checked at a time.
*   
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/form
*   https://ui.shadcn.com/docs/components/radio
*
*   PROPS
*   aria-describedby: id of the element that describes the input in ...props (string, optional)
*   aria-invalid: determines if the input is invalid in ...props (boolean, required)
*   className: custom styling (SCSS or tailwind style, optional)
*   defaultValue: initial value (string, optional)
*   name: input name (string, required)
*   options: [{ value: string, label: string }] (array, required)
*
**********/

import { forwardRef } from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Icon, cn } from 'components/lib';

const RadioGroup = forwardRef(({ className, options, onChange, name, ...props }, ref) => {

  return (
    <RadioGroupPrimitive.Root 
      ref={ ref } 
      className={ cn('grid gap-2', className) } {...props } 
      onValueChange={ value => onChange({ target: { name, value }, type: 'change' })}>

      { options?.length &&
        options.map(option => {
        return (
          <div className='flex items-center space-x-2' key={ option.value }>
            <RadioGroupItem value={ option.value } id={ option.value } />
            <label htmlFor={ option.value } className='text-slate-900'>{ option.label }</label>
          </div>
        )
      })}

    </RadioGroupPrimitive.Root>
  );
})

RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = forwardRef(({ className, ...props }, ref) => {

  return ( 
  <RadioGroupPrimitive.Item ref={ ref } className={ cn('aspect-square h-4 w-4 rounded-full border border-slate-200 text-slate-900 ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:data-[state=checked]:bg-slate-50 dark:data-[state=checked]:text-slate-900', className) } {...props }>
    <RadioGroupPrimitive.Indicator className='flex items-center justify-center'>

      <Icon name='circle' className='h-2.5 w-2.5 fill-current text-current'/>

    </RadioGroupPrimitive.Indicator>

  </RadioGroupPrimitive.Item>
  );
})

RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
