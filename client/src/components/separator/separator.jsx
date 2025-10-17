/***
*
*   SEPARATOR
*   Decorative separator with optional label
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/separator
*   https://ui.shadcn.com/docs/components/separator
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   decorative: whether the element is decorative or not (boolean, optional, default: true)
*   label: display a label over the separator (string, optional)
*   orientation: vertical or horizontal (string, optional, default: horizontal)
*   url: url of page to share (string, required)
*
**********/

import { forwardRef } from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { cn } from 'components/lib';

const Separator = forwardRef(({ className, label, orientation = 'horizontal', decorative = true, ...props }, ref) => (

  <SeparatorPrimitive.Root 
    ref={ ref } 
    decorative={ decorative } 
    orientation={ orientation } 
    className={ cn('relative my-6 shrink-0 bg-slate-200 dark:bg-slate-800', orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]', className)}
    { ...props }>

    { label && 
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 dark:bg-slate-900 dark:text-slate-400'>
        { label }
      </div> 
    }

  </SeparatorPrimitive.Root>
))

Separator.displayName = SeparatorPrimitive.Root.displayName
export { Separator }
