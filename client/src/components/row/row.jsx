/***
*
*   ROW
*   Add space below a UI or group of UI elements.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/row
*
*   PROPS
*   children: the children to render (component(s), required)
*   className: custom styling (SCSS or tailwind style, optional)
*   width: restrict the width of the row (integer, optional, default: none)
*
**********/

import { Children } from 'react';
import { cn } from 'components/lib';

export function Row({ children, width, className }){

  const widths = {
    sm: 'sm:max-w-sm',
    md: 'md:max-w-md',
    lg: 'lg:max-w-lg',
    xl: 'xl:max-w-xl',
  }
  
  return(
    <section className={ cn('mb-4', width && widths[width], className) }>
      { Children.map(children, child => child) }
    </section>
  );
}