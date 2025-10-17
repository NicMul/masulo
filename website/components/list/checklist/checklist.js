/***
*
*   CHECKLIST
*   List items with X or ✓
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   color: green or white check icons (string, optional, default: white)
*   items: array of objects containing keys: name (string) and checked (bool) (array, required)
*   onClick: add to individual items in array as callback (function, optional)
*
**********/

import { ClassHelper, Icon } from 'components/lib';
import Style from './checklist.tailwind.js';

export function CheckList(props){

  if (!props.items)
    return <div>No items in list</div>

  const checklistStyle = ClassHelper(Style, {

    checklist: true,
    className: props.className, 

  });

  return (
    <ul className={ checklistStyle }>
      { props.items.map((item, index) => {

        return(
          <li onClick={ item.onClick } className={ Style.item } key={ index }>

            <Icon 
              image={ item.checked ? 'check-circle' : 'x-circle'  }
              className={ Style.icon } 
              color={ item.checked ? 'green' : 'red' }
            />

            { item.name }

          </li>
        );

      })}
    </ul>
  );
}