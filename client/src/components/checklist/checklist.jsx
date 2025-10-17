/***
*
*   CHECKLIST
*   List items with colored X or ✓.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/checklist
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   items: [{ checked: boolean, callback: function, color: string }] (array, required)
*
**********/

import { Icon, cn } from 'components/lib';

export function CheckList({ items, className }){

  if (!items?.length)
    return null;

  return (
    <ul className={ cn('flex flex-col gap-y-2 ml-0 list-none', className )}>
      { items.map((item, index) => {

        const itemStyle = cn({
          'flex text-slate-700 flex-row gap-x-2 items-center w-full dark:text-slate-50': true,
          'cursor-pointer [&_span]:hover:underline': item.callback,
        });
        
        return(
          <li className={ itemStyle } key={ index } onClick={ () => item?.callback?.() }>

            <Icon 
              name={ item.checked ? 'check' : 'x' } 
              color={ item.color || 'dark' }
            />

            <span>{ item.name }</span>

          </li>
        );
      })}
    </ul>
  );
}