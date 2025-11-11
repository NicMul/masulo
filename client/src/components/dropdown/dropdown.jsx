/***
*
*   DROPDOWN
*   Displays a menu to the user — such as a set of 
*   actions or functions — triggered by a button.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/dropdown
*   https://ui.shadcn.com/docs/components/dropdown-menu
*
*   PARAMS
*   children: children to render (component(s), required)
*   className: custom class (SCSS or tailwind style, optional)
*   inset: toggle trigger style (boolean, optional)
*
**********/

import{ forwardRef } from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Icon, cn } from 'components/lib'

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = forwardRef(({ className, inset, children, ...props }, ref) => (

  <DropdownMenuPrimitive.SubTrigger 
    ref={ ref } 
    className={ cn(`flex cursor-default select-none items-center rounded-sm px-2 py-1.5 [&_*]:!text-sm outline-none focus:bg-slate-100 data-[state=open]:bg-slate-100 dark:focus:bg-slate-800 dark:data-[state=open]:bg-slate-800`, inset && `inset-x-0`, className) } {...props }>
    
      { children }
      <Icon name='chevron-right' className={ `ml-auto h-4 w-4` }/>

  </DropdownMenuPrimitive.SubTrigger>
))

DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = forwardRef(({ className, ...props }, ref) => (

  <DropdownMenuPrimitive.SubContent 
    ref={ ref }
    className={ cn(`z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-lg data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50`, className) } 
    {...props} 
  />
))

DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = forwardRef(({ className, sideOffset = 4, ...props }, ref) => (

  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content 
      ref={ ref } 
      sideOffset={ sideOffset } 
      className={ cn(`w-56 z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50`, className) }
      {...props } 
    />
  </DropdownMenuPrimitive.Portal>
))

DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = forwardRef(({ className, inset, ...props }, ref) => (

  <DropdownMenuPrimitive.Item 
    ref={ ref } 
    className={ cn(`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 [&_*]:!text-sm outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-800 dark:focus:text-slate-50 [&>svg]:mr-2`, inset && `pl-8`, className) }
    {...props } 
  />
))

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = forwardRef(({ className, children, checked, ...props }, ref) => (

  <DropdownMenuPrimitive.CheckboxItem 
    ref={ ref } 
    className={ cn('relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm [&_*]:!text-sm outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-800 dark:focus:text-slate-50', className) } 
    checked={ checked } 
    {...props }
  >

    <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
      <DropdownMenuPrimitive.ItemIndicator>
        <Icon name='check' className='h-4 w-4' />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>

    { children }

  </DropdownMenuPrimitive.CheckboxItem>
))

DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = forwardRef(({ className, children, ...props }, ref) => (

  <DropdownMenuPrimitive.RadioItem 
    ref={ ref } 
    className={ cn('relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm [&_*]:!text-sm outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-800 dark:focus:text-slate-50', className) } 
    {...props }
  >
    
    <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
      <DropdownMenuPrimitive.ItemIndicator>
        <Icon name='circle' className={ `h-2 w-2 fill-current` } />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    
    { children }
    
  </DropdownMenuPrimitive.RadioItem>
))

DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = forwardRef(({ className, inset, ...props }, ref) => (

  <DropdownMenuPrimitive.Label ref={ ref } className={ cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className) } {...props } />

))

DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = forwardRef(({ className, ...props }, ref) => (

  <DropdownMenuPrimitive.Separator ref={ ref } className={ cn('-mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800',className) } {...props } />

))

DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({ className, ...props }) => {

  return <span className={ cn('ml-auto tracking-widest opacity-60', className) } {...props } />

}

DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup,
  DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuRadioGroup
}
