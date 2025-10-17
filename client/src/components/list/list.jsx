/***
*
*   LIST
*   Ordered or unordered list.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/list
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   items: [string] (array, required)
*   ordered: show an ordered list (boolean, optional)
*
**********/

import { cn } from 'components/lib';

export function List({ className, items, ordered }){

  if (!items?.length)
    return null;

  const List = ordered ? 'ol' : 'ul';
  const itemStyle = ordered ? 'list-decimal ml-4 mb-2 leading-4' : 'relative pl-4 mb-1 leading-4 before:content-[""] before:rounded-full before:bg-primary before:w-2 before:h-2 before:absolute before:top-1/2 before:left-0 before:-translate-y-1/2';

  return (
    <List className={ cn('list-none', className) }>
      { items.map(item => (
        <li className={ itemStyle } key={ item }>
          { item }
        </li>
      ))}
    </List>
  );
}
