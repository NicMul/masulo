/***
*
*   BUTTON
*   Displays a button or a component that looks like a button.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/button
*   https://ui.shadcn.com/docs/components/button
*
*   PROPS
*   action: callback function (function, optional)
*   asChild: render as a slot (boolean, optional)
*   children: button text or child component (component, optional)
*   className: custom class (SCSS or tailwind style, optional)
*   color: red/orange/blue/green (string, default: black)
*   icon: icon image (string, optional)
*   iconColor: hex color for icon outline (hex string, optional)
*   iconFill: hex color for icon full (hex string, optional)
*   iconSize: icon size (integer, optional)
*   loading: toggle loading animation (boolean, optional)
*   params: object passed to the callback function (object, optional)
*   size: xs/sm/lg/icon/full (string, optional)
*   text: button label (string, optional)
*   type: type eg. submit (text, optional)
*   url: navigate to internal or external url (string, optional)
*   variant: destructive/ghost/icon/link/naked/outline/rounded/secondary (optional, string)
*
**********/

import { forwardRef } from 'react'
import { Icon, useNavigate } from 'components/lib';
import { Slot } from '@radix-ui/react-slot'
import { cn } from 'components/lib';
import ButtonVariants from './button.tailwind.js';

const Button = forwardRef(({ children, type, className, variant, size, color, text, icon, 
  iconSize, iconFill, iconColor, action, params, loading, asChild, url, ...props }, ref) => {
  
  const navigate = useNavigate();

  const Comp = asChild ? Slot : 'button';
  const resolvedIcon = loading ? 'loader-circle' : icon;
  size = variant === 'link' ? 'link' : size;
  
  let iconCSS;

  if (resolvedIcon){

    if (!text){

      size = 'icon';
      variant = variant || 'icon';

    }

    iconCSS = cn({
      'mr-2': text,
      'animate-spin': loading,
      'absolute left-3 top-1/2 -mt-[0.525em]': loading && variant !== 'outline',
    });
  }

  return (
    <Comp
      ref={ ref }  
      type={ type }
      onClick={ e => {

        action?.(params);
        
        if (url)
          url?.startsWith('http') ? window.location = url : navigate(url);

      }}
      className={ cn(ButtonVariants({ variant, size, color, className })) }
      {...props }>

      { resolvedIcon && 
        <Icon
          name={ resolvedIcon }
          size={ iconSize}
          fill={ iconFill }
          color={ iconColor }
          className={ iconCSS }
        />
      }

      { size !== 'icon' && (children || text) }

    </Comp>
  );
});

Button.displayName = 'Button';
export { Button };
