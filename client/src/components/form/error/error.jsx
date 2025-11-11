/***
*
*   ERROR
*   Error message displayed below a form input.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/form
*
*   PROPS
*   id: unique id associated with the input (string, required)
*   children: error message (string, required)
*
**********/

import { cn } from 'components/lib';

export function Error({ id, children, className }){

  return (
    <div id={ id } className={ cn('mt-2 font-medium text-red-500 dark:text-red-500', className) }>
      { children }
    </div>
  )
}