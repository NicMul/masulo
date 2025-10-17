/***
*
*   LIST
*   Ordered or unordered list
*
*   PROPS
*   items: array of string values (array, required)
*   ordered: show an ordered list (boolean, optional)
*
**********/

import { ClassHelper } from 'components/lib';
import Style from './list.tailwind.js';

export function List(props){

  if (!props.items?.length)
    return false;

  const css = ClassHelper(Style, {

    list: true,
    ol: props.ordered,
    ul: !props.unordered

  })

  if (props.ordered){
    return (
      <ol className={ css }>
        { props.items.map((item, index) => {

            return <li className={ Style.olitem } key={ item }>{ item }</li>

         })}
      </ol>
    );
  }

  return (
    <ul className={ css }>
      { props.items.map((item, index) => {

        return <li className={ Style.ulitem } key={ item }>{ item }</li>

      })}
    </ul>
  );
}
