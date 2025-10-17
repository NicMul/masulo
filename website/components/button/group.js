/***
*
*   BUTTONGROUP
*   A group of two or more buttons shown in a row
*
*   PROPS
*   buttons: button objects (see button.js comments) (array, required)
*   className: custom class (SCSS or tailwind style, optional)
*   style: css style object (css style, optional)
*/

import { Button, ClassHelper } from 'components/lib';
import Style from './group.tailwind.js';

export function ButtonGroup(props){

  const css = ClassHelper(Style, {

    group: true,
    className: props.className,

  });

  return (
    <div className={ css } style={ props.style }>
      { props.buttons.map((button, i) => {

        return (
          <Button 
            key={ i }
            url={ button.url } 
            text={ button.text } 
            outline={ i !== 0 } 
            className={ Style.button } 
          />
        )
      })}
    </div>
  )
}