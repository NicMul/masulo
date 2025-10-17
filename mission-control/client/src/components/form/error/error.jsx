/***
*
*   ERROR
*   Error message that renders below a form input
*   Props are passed from the form
* 
*   PROPS
*   message: the error message (string, required)
*
**********/

import { ClassHelper } from 'components/lib';
import Style from './error.tailwind.js';

export function Error(props){

  const errorStyle = ClassHelper(Style, props);

  return (
    <div className={ errorStyle }>
      { props.message }
    </div>
  )
}