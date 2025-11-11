/***
*
*   TOOLTIP
*   A popup that displays information related to an element when the
*   element receives keyboard focus or the mouse hovers over it.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/tooltip
*   https://ui.shadcn.com/docs/components/tooltip
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   children: component(s) (component(s), required)
*
**********/

import { forwardRef } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from 'components/lib'

const TooltipProvider = TooltipPrimitive.Provider
const TooltipRoot = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const Tooltip = forwardRef(({ className, children, ...props }, ref) => (

  <div className='relative'>
    <TooltipProvider>
      <TooltipRoot ref={ ref } {...props }>

        { children }

      </TooltipRoot>
    </TooltipProvider>
  </div>

))

const TooltipContent = forwardRef(({ className, sideOffset = 4, ...props }, ref) => (

  <TooltipPrimitive.Content ref={ ref } sideOffset={ sideOffset }
    className={ cn('z-50 overflow-hidden rounded-md border border-slate-200 bg-white px-3 py-1.5 text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50', className) } {...props} />

))

TooltipContent.displayName = TooltipPrimitive.Content.displayName
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
