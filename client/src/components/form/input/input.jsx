/***
*
*   INPUT
*   Text input for all types (phone, url, email, etc)
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/form
*   https://ui.shadcn.com/docs/components/input
*
*   PROPS
*   aria-describedby: id of the element that describes the input in ...props (string, optional)
*   aria-invalid: determines if the input is invalid in ...props (boolean, required)
*   className: custom styling (SCSS or tailwind style, optional)
*   defaultValue: initial value (string, optional)
*   disabled: disable the input (boolean, optional)
*   name: input name (string, required)
*   placeholder: placeholder value (string, optional)
*   type: input type (string, required, default: text)
*   value: current value (string, optional)
*
**********/

import { forwardRef } from 'react';
import { cn } from 'components/lib';

const Input = forwardRef(({ className, name, defaultValue, value, type, placeholder, onChange, disabled, ...props }, ref) => {

  return (
    <input 
      name={ name }
      ref={ ref } 
      autoComplete={ name }
      disabled={ disabled }
      type={ type || 'text' } 
      placeholder={ placeholder }
      className={ cn('flex items-center h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 dark:color-scheme-dark', className, props['aria-invalid'] && 'border-red-500') } 
      onChange={ e => onChange({ 
        type: 'change',
        target: { 
          name: name, 
          value: type === 'file' ? e.target?.files : e.target.value 
        }
      })}
      {...type != 'file' && { value: value || '', defaultValue: defaultValue }}
      {...props } 
    />
  )
})

Input.displayName = 'Input'
export { Input }