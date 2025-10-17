/***
*
*   CHECKBOX
*   Checkbox toggle used within the form
*   Props are passed from the fieldset
*   
*   PROPS
*   callback: executed on change (function, required)
*   checked: toggle the checkmark (boolean, required)
*   className: custom styling (SCSS or tailwind style, optional)
*   index: index of checkbox in fieldset (integer, required)
*   name: name of the input to be used as the label (string, required)
*   option: individual option passed from the fieldset (string, required)
*   required: show the required * in the label (boolean, optional)
*
**********/

import { Label, ClassHelper } from 'components/lib';
import Style from './checkbox.tailwind.js';

export function Checkbox(props){

  const css = ClassHelper(Style, {

    input: true,
    className: props.className
    
  });

  return (
    <div>
      <input
        type='checkbox'
        name={ props.name }
        id={ props.option }
        value={ props.option }
        className={ css }
        checked={ props.checked ? 'checked' : '' }
        onChange={ e => props.callback(props.index, props.checked, props.option)}
      />

      { props.option && 
        <Label
          text={ props.option }
          required={ props.required }
          for={ props.option }
          className={ Style.label }
        />
      }
      
    </div>
  );
}