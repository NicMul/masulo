/***
*
*   POPOVER
*   Displays rich content in a portal, triggered by a button.
* 
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/popover
*   https://ui.shadcn.com/docs/components/popover
*
*   PROPS
*   align: start/center/end (string, required, default: center)
*   children: <Trigger> and <PopoverContent> (components, required)
*   className: custom styling (SCSS or tailwind style, optional)
*   sideOffset: offset (integer, optional, default: 4)
*
**********/

import { forwardRef } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from 'components/lib'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = forwardRef(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (

  <PopoverPrimitive.Portal>

    <PopoverPrimitive.Content ref={ ref } align={ align } sideOffset={ sideOffset }
      className={ cn('z-50 w-72 rounded-md border border-slate-200 bg-white p-4 text-slate-950 shadow-md outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:shadow-lg', className) } {...props }/>

  </PopoverPrimitive.Portal>
))

PopoverContent.displayName = PopoverPrimitive.Content.displayName
export { Popover, PopoverTrigger, PopoverContent }
