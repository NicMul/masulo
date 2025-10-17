/***
*
*   PROGRESS BAR
*   Displays a bar indictor.

*   DOCS
*   https://docs.usegravity.app/gravity-web/components/progress
*   https://ui.shadcn.com/docs/components/progress  
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   value: percentage value (integer, required)
*
**********/

import { forwardRef } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from 'components/lib'

const Progress = forwardRef(({ className, value, ...props }, ref) => (

  <ProgressPrimitive.Root ref={ ref  } className={ cn('relative h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800', className) } {...props }>
    
    <ProgressPrimitive.Indicator className='h-full w-full flex-1 bg-emerald-500 transition-all'
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />

  </ProgressPrimitive.Root>

))

Progress.displayName = ProgressPrimitive.Root.displayName
export { Progress }
