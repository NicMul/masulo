/***
*
*   SELECT
*   Displays a list of options for the user to pick from—triggered by a button.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/form
*   https://ui.shadcn.com/docs/components/select
*   
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   defaultValue: default selected option (string, optional)
*   name: name of the input (string, required)
*   options: [{ value: string, label: string }] (array, required)
*   placeholder: placeholder text (string, optional)
*   required: input is required (boolean, optional)
*   onChange: callback (function, optional)
*
**********/

import { forwardRef } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Icon, useTranslation, cn } from 'components/lib';

const SelectRoot = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const Select = forwardRef(({ name, options, onChange, defaultValue, placeholder, className, ...props }, ref) => {

  const { t } = useTranslation();

  // sort into groups (or ungrouped)
  const groups = options?.length ? options.reduce((acc, option) => {

    if (option.group){

      acc[option.group] ? 
        acc[option.group].push(option) :
        acc[option.group] = [option];

    } else {

      acc['ungrouped'] ? 
        acc['ungrouped'].push(option) :
        acc['ungrouped'] = [option];

    }
    return acc;
  }, {}) : {};

  return (
    <SelectRoot {...props  } defaultValue={ defaultValue } onValueChange={ value => onChange({ target: { name, value }, type: 'change' })}>

      <SelectTrigger valid={ !props['aria-invalid'] } className='flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300'>
        <SelectValue placeholder={ placeholder || t('global.form.select.placeholder') }/>
      </SelectTrigger>

      <SelectContent className='relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-50'>

        { Object.keys(groups).map(group => {

          if (group === 'ungrouped') {

            return groups[group].map(option => (
              <SelectItem value={ option.value } key={ option.value } className='relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 outline-none focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-900 dark:focus:text-slate-50'>
                { option.label }
              </SelectItem>
            ));

          } 
          else {
            return (
              <SelectGroup key={ group} label={ group }>

                <SelectLabel>{ group }</SelectLabel>

                { groups[group].map((option) => (
                  <SelectItem value={ option.value } key={ option.value } className='relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 outline-none focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-900 dark:focus:text-slate-50'>
                    { option.label }
                  </SelectItem>
                ))}

              </SelectGroup>
            );
          }
        })}     
  
      </SelectContent> 
    </SelectRoot>
  )
});

const SelectTrigger = forwardRef(({ valid, className, children, ...props }, ref) => (

  <SelectPrimitive.Trigger ref={ ref } className={ cn('flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300', !valid && 'text-red-500', className) } {...props }>

    { children }

    <SelectPrimitive.Icon asChild>
      <Icon name='chevron-down' className='ml-1 h-4 w-4 opacity-50' />
    </SelectPrimitive.Icon>

  </SelectPrimitive.Trigger>
))

SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = forwardRef(({ className, children, ...props }, ref) => (

  <SelectPrimitive.Portal>

    <SelectPrimitive.Content ref={ ref }
      className={ cn('relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-50', className)}
      position={ 'popper' } {...props }>

      <SelectScrollUpButton />

      <SelectPrimitive.Viewport 
        className={ cn('p-1', 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1') }>
          
        { children }

      </SelectPrimitive.Viewport>

      <SelectScrollDownButton />

    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))

SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = forwardRef(({ className, children, ...props }, ref) => (

  <SelectPrimitive.Item ref={ ref } className={ cn('relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 outline-none focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-900 dark:focus:text-slate-50', className)} {...props}>

    <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
      <SelectPrimitive.ItemIndicator>
        <Icon name='check' className='h-4 w-4'/>
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{ children }</SelectPrimitive.ItemText>

  </SelectPrimitive.Item>
))

SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectScrollUpButton = forwardRef(({ className, ...props }, ref) => (

  <SelectPrimitive.ScrollUpButton ref={ ref } className={ cn('flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600', className)}{...props} >
    <Icon name='chevron-up' className='h-4 w-4' />
  </SelectPrimitive.ScrollUpButton>

))

SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = forwardRef(({ className, ...props }, ref) => (

  <SelectPrimitive.ScrollDownButton ref={ ref } className={ cn('flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600', className) } {...props}>
    <Icon name='chevron-down' className='h-4 w-4' />
  </SelectPrimitive.ScrollDownButton>

))

SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectSeparator = forwardRef(({ className, ...props }, ref) => (

  <SelectPrimitive.Separator ref={ ref } className={cn('h-px w-full my-2 bg-slate-200 dark:bg-slate-700', className)} {...props} />

))

SelectSeparator.displayName = SelectPrimitive.Separator.displayName

const SelectLabel = forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label ref={ ref } className={cn('text-sm font-semibold text-slate-900 dark:text-slate-50', className)} {...props} />
))

SelectLabel.displayName = SelectPrimitive.Label.displayName

export { 
  
  Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel,
  SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton

}