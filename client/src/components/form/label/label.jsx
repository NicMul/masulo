/***
*
*   LABEL
*   Renders an accessible label associated with controls.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/form
*   https://ui.shadcn.com/docs/components/label
*
*   PROPS
*   for: name of the corresponding input in ...props (string, optional)
*   children: label text (string, required)
*   className: additional classes (string, optional)
*   required: show asterisk if true (boolean, optional)
*
**********/

import { forwardRef } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from 'components/lib';

const Label = forwardRef(({ className, children, required, ...props }, ref) => (

  <LabelPrimitive.Root ref={ ref } className={ cn('block font-medium mb-2 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className) } {...props }>

    { children } 

    { required && 
      <span className='text-red-500'>*</span> 
    }

  </LabelPrimitive.Root>  
))

Label.displayName = LabelPrimitive.Root.displayName
export { Label }