/***
*
*   DESCRIPTION
*   Input description helper.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/form
*
*   PROPS
*   id: unique id associated with the input (string, required)
*   children: description text (string, required)
*
**********/

import { cn } from 'components/lib';

export function Description({ id, children, className }){

  return (
    <div id={ id } className={ cn('mt-2 text-slate-500 dark:text-slate-400', className) }>
      { children }
    </div>
  )
}