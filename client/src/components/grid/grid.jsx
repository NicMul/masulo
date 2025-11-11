/***
*
*   GRID
*   Responsive one-to-six-column grid layout.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/grid
*
*   PROPS
*   children: the children to render (component(s), required)
*   className: custom styling (SCSS or tailwind style, optional)
*   max: max cols 2-8 (integer, required, default: 2)
*
**********/

import { Children } from 'react';
import { cn } from 'components/lib';

export function Grid({ children, max = 2, className }){

  const colNames = { 
    2: 'sm:grid-cols-2', 
    3: 'sm:grid-cols-2 md:grid-cols-3',
    4: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    6: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
    7: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7',
    8: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8',
  };

  return(
    <section className={ cn('grid gap-4 mb-4', colNames[max], className) }>
      { Children.map(children, child => child) }
    </section>
  );
}