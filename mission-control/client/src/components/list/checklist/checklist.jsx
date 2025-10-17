/***
*
*   CHECKLIST
*   List items with X or ✓
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   color: green or white check icons (string, optional, default: white)
*   hideCross: hide the cross icons (boolean, optional)
*   interactive: show a pointer icon on hover (boolean, optional)
*   items: array of objects containing keys: name (string) and checked (bool) (array, required)
*   onClick: add to individual items in array as callback (function, optional)
*
**********/

import { ClassHelper } from 'components/lib';
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

        item.style = ClassHelper(Style, {

          item: true,
          checkGreen: item.checked && !props.color,
          checkWhite: item.checked && props.color === 'white',
          cross: !props.hideCross && !item.checked,
          interactive: props.interactive

        })

        return(
          <li 
            onClick={ item.onClick }
            className={ item.style } 
            key={ index }>
            { item.name }
          </li>
        );

      })}
    </ul>
  );
}