/***
*
*   ALERT
*   Displays a callout for user attention.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/alert
*   https://ui.shadcn.com/docs/components/alert
*
*   PROPS
*   button: see button component props (object, optional)
*   className: custom styling (SCSS or tailwind style, optional)
*   description: description (string, optional)
*   icon: override the variant icon (string, optional)
*   title: title (string, optional)
*   variant: info/success/warning/error (string, optional)
*
**********/

import { forwardRef } from 'react'
import { Icon, Button, cn } from 'components/lib';
import { Variants } from './alert.tailwind.js';

const Alert = forwardRef(({ className, variant, icon, title, description, button, ...props }, ref) => {
  
  const variants = { 
    
    info: { 
      icon: 'info',
      color: 'blue',
    },
    success: {
      icon: 'circle-check',
      color: 'green',
    },
    warning: {
      icon: 'circle-alert',
      color: 'orange',
    },
    error: {
      icon: 'circle-x',
      color: 'red',
    }  
  }
  
  return (
    <div ref={ ref } role='alert' className={ cn(Variants({ variant }), className) } {...props }>

      <Icon name={ icon || variants[variant || 'info'].icon } size={ 20 } />

      { title &&
        <h2>{ title }</h2> 
      }

      { description &&
        <p>{ description }</p> 
      }

      { button &&
        <Button {...button } size='sm' color={ variant ? variants[variant].color : 'default' } /> 
      }

    </div>
  );
})

Alert.displayName = 'Alert'
export { Alert }
