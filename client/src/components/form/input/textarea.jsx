/***
*
*   TEXTAREA
*   Textarea input.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/form
*   https://ui.shadcn.com/docs/components/textarea
*
*   PROPS
*   aria-describedby: id of the element that describes the input in ...props (string, optional)
*   aria-invalid: determines if the input is invalid in ...props (boolean, required)
*   className: custom styling (SCSS or tailwind style, optional)
*   defaultValue: initial value (string, optional)
*   disabled: disable the input (boolean, optional)
*   name: input name (string, required)
*   placeholder: placeholder value (string, optional)
*   type: input type (string, required)
*   value: current value
*
**********/

import { forwardRef } from 'react';
import { cn } from 'components/lib';

const Textarea = forwardRef(({ className, name, value, defaultValue, disabled, type, ...props }, ref) => {

  const css = cn('flex items-center h-32 w-full rounded-md border border-slate-200 bg-white px-3 py-2 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 dark:color-scheme-dark', className, props['aria-invalid'] && 'border-red-500')
  return (
    <textarea 
      name={ name }
      className={ css } 
      ref={ ref } 
      value={ value }
      defaultValue={ defaultValue }
      disabled={ disabled }
      {...props} 
    />
  )

})

Textarea.displayName = 'Textarea'
export { Textarea }
