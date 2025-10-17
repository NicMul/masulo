/***
*
*   TABS
*   A set of layered sections displayed one at a time.
*   
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/tabs
*   https://ui.shadcn.com/docs/components/tabs
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   defaultValue: default selected tab in ...props (string, optional)
*
**********/

import { forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from 'components/lib';

const Tabs = TabsPrimitive.Root

const TabsList = forwardRef(({ className, ...props }, ref) => (

  <TabsPrimitive.List ref={ ref } className={ cn('inline-flex justify-center h-10 p-1 rounded-sm bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', className) } {...props} />
    
))

TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = forwardRef(({ className, ...props }, ref) => (

  <TabsPrimitive.Trigger ref={ref} className={ cn('inline-flex items-center justify-center whitespace-nowrap rounded-sm px-12 py-1.5 font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:first:radius-tl-2 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:data-[state=active]:bg-primary dark:data-[state=active]:text-slate-50', className) } {...props }/>

))

TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = forwardRef(({ className, ...props }, ref) => (

  <TabsPrimitive.Content ref={ ref } className={ cn(`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300`, className) } {...props} />

))

TabsContent.displayName = TabsPrimitive.Content.displayName
export { Tabs, TabsList, TabsTrigger, TabsContent }
