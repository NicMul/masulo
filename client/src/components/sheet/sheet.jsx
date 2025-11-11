/***
*
*   SHEET
*   Overlays a modal on the top/left/bottom/right of the viewport.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/sheet
*   https://ui.shadcn.com/docs/components/sheet
*
*   PROPS
*   children: child component(s) (component(s), optional)
*   className: custom styling (SCSS or tailwind style, optional)
*   description: sheet description (string, optional)
*   side: left/right/top/bottom (string, required, default: right)
*   title: sheet title (string, optional)
*   trigger: trigger component (component, required)
*
**********/

import { forwardRef } from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { Icon, cn } from 'components/lib'
import { Variants } from './sheet.tailwind.js';

const SheetRoot = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const Sheet = forwardRef(({ trigger, title, accessibleTitle, description, className, children, side = 'right' }, ref) => (

  <SheetRoot>

    <SheetTrigger asChild>
      { trigger } 
    </SheetTrigger>

    <SheetContent side={ side } className={ className }>

      { title || accessibleTitle || description ? 
        <div className={ cn('flex flex-col space-y-2 text-center sm:text-left', className) }>

          <SheetTitle hidden={ accessibleTitle }>
            { title || accessibleTitle }
          </SheetTitle>

          <div className='text-slate-500 dark:text-slate-400'>
            { description }
          </div>

        </div> : undefined 
      }

      { children }

    </SheetContent>
  </SheetRoot>
))

const SheetOverlay = forwardRef(({ className, ...props }, ref) => (

  <SheetPrimitive.Overlay ref={ ref } className={ cn(`fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0`, className) } {...props }/>

))

SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const SheetContent = forwardRef(({ side = 'right', className, children, ...props }, ref) => (

  <SheetPortal>

    <SheetOverlay />
    <SheetPrimitive.Content ref={ ref } className={ cn(Variants({ side }), className) } {...props }>

      { children }

      <SheetPrimitive.Close className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 dark:ring-offset-slate-950 dark:focus:ring-slate-300 dark:data-[state=open]:bg-slate-800'>

        <Icon name='x'/>
        <span className='sr-only'>Close</span>
        
      </SheetPrimitive.Close>

    </SheetPrimitive.Content>
  </SheetPortal>
))

SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }) => (

  <div className={ cn('flex flex-col space-y-2 text-center sm:text-left', className) } {...props} />
)

SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({ className, ...props }) => (

  <div className={ cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className) } {...props} />
)

SheetFooter.displayName = 'SheetFooter'

const SheetTitle = forwardRef(({ className, hidden, ...props }, ref) => (

  <SheetPrimitive.Title ref={ ref } className={ cn('text-lg font-semibold text-slate-950 dark:text-slate-50', hidden && 'sr-only', className) } {...props} />

))

SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = forwardRef(({ className, ...props }, ref) => (

  <SheetPrimitive.Description ref={ ref } className={ cn('text-slate-500 dark:text-slate-400', className)} {...props} />

))

SheetDescription.displayName = SheetPrimitive.Description.displayName

export { Sheet, SheetRoot, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, 
  SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription,
}
