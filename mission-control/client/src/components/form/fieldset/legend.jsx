/***
*
*   LEGEND
*   Fieldset legend
*   Props are passed from the form
*   
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   error: highlight in red (boolean, optional)
*   required: input is required (boolean, optional)
*   text: label for the legend (string, required)
*
**********/

import { ClassHelper } from 'components/lib';
import Style from './legend.tailwind.js';

export function Legend(props){

  const css = ClassHelper(Style, { 

    className: props.className,
    required: props.required,
    error: !props.valid

  });

  return(
    <legend className={ css }>
      { props.text }
    </legend>
  );
}
