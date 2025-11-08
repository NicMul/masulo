/***
*
*   DIALOG
*   A window overlaid on either the primary window or another dialog window, 
*   rendering the content underneath inert.
*
*   Dialog/modal can be opened anywhere by calling context.dialog.open() 
with an object containing the following params
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/dialog
*   https://ui.shadcn.com/docs/components/dialog
*
*   PARAMS
*   children: children to render in a custom dialog (component(s), optional)
*   description: description message (string, optional)
*   form: refer to form docs (object, optional)
*   onClose: callback executed when closed (function, required)
*   open: override the open state (boolean, optional)
*   title: title (string, required)
*
**********/

import { forwardRef } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Form, Icon, cn } from 'components/lib';

const DialogRoot = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const Dialog = forwardRef(({ className, children, title, description, form, open, onClose, ...props }, ref) => {

  // render children or a form as default
  return (
    <DialogRoot open={ open } onOpenChange={ () => onClose(true) } {...props }>

      <DialogContent className={ className }>
        
        { title || description ?
          <DialogHeader>

            { title && 
              <DialogTitle>{ title }</DialogTitle> 
            } 

            { description && 
              <DialogDescription>{ description }</DialogDescription> 
            }

          </DialogHeader> : undefined 
        }

        { children ||
          <Form 
            {...form } 
            callback={ (res, data) => { onClose(false, res, data) }}
            cancel={ () => onClose(true) }
          />
        }
          
      </DialogContent > 

    </DialogRoot>
  )
});

const DialogOverlay = forwardRef(({ className, ...props }, ref ) => (

  <DialogPrimitive.Overlay 
    ref={ ref } 
    className={ cn('fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className) } 
    {...props } 
  />
))

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = forwardRef(({ className, children, ...props }, ref) => (

  <DialogPortal>

    <DialogOverlay />

    <DialogPrimitive.Content ref={ ref } className={ cn('fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:zoom-in-95 data-[state=open]:animate-in data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg dark:border-slate-800 dark:bg-slate-900', className) } {...props }>

      { children }
      
      <DialogPrimitive.Close className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 data-[state=open]:text-slate-500 dark:ring-offset-slate-950 dark:focus:ring-slate-300 dark:data-[state=open]:bg-slate-800 dark:data-[state=open]:text-slate-400'>
        
        <Icon name='x' className={ 'w-4 h-4' } />
        <span className={ 'sr-only' }>
          Close
        </span>

      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))

DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }) => (

  <div className={ cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props } />

)

DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }) => (

  <div className={ cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className) } {...props} />

)

DialogFooter.displayName = 'DialogFooter'

const DialogTitle = forwardRef(({ className, ...props }, ref) => (

  <DialogPrimitive.Title ref={ ref } className={ cn('text-xl font-semibold leading-none tracking-tight', className) } {...props} />

))

DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = forwardRef(({ className, ...props }, ref) => (

  <DialogPrimitive.Description ref={ ref } className={cn('text-slate-500 dark:text-slate-400', className)} {...props} />

))

DialogDescription.displayName = DialogPrimitive.Description.displayName

export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
}
