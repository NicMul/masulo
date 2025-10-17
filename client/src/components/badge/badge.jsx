/***
*
*   BADGE
*   Displays a badge or a component that looks like a badge.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/badge
*   https://ui.shadcn.com/docs/components/badge
*
*   PROPS
*   className: custom class (SCSS or tailwind style, optional)
*   children: badge text (string, required) 
*   variant: secondary/destructive/outline/blue/green/red/orange (string, optional)
*
**********/

import { cn } from 'components/lib';
import Variants from './badge.tailwind.js';

function Badge({ className, variant, ...props }){

  return <div className={ cn(Variants({ variant })) } {...props} />

}

export { Badge }
