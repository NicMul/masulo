/***
*
*   BADGE
*   Text badge with background color
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   color: blue/red/green/orange (string, required)
*   text: text to be displayed (string, required) 
*
**********/

import { ClassHelper } from 'components/lib';
import Style from './badge.tailwind.js';

export function Badge(props){

  const badgeStyle = ClassHelper(Style, {

    [props.color]: true,
    className: props.className

  })

  return (

    <span className={ badgeStyle }>
      { props.text }
    </span>

  );
}