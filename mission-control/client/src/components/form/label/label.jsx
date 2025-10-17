/***
*
*   LABEL
*   Form input label
*   Props are passed from the input
*
*   PROPS
*   for: name of the corresponding input (string, optional)
*   text: label text (string, required)
*   
**********/

import { ClassHelper } from 'components/lib';
import Style from './label.tailwind.js';

export function Label(props){

  const labelStyle = ClassHelper(Style, props);

  return(
    <label className={ labelStyle } htmlFor={ props.for }>
      { props.text }
    </label>
  );
}