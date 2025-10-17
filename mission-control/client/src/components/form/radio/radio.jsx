/***
*
*   RADIO
*   Radio toggle used within the form
*   Props are passed from the fieldset
*   
*   PROPS
*   callback: executed on change (function, required)
*   className: custom styling (SCSS or tailwind style, optional)
*   checked: toggle the checkmark (boolean, required)
*   index: index of checkbox in fieldset (integer, required)
*   name: name of the input to be used as the label (string, required)
*   option: individual option passed from the fieldset (string, required)
*   required: show the required * in the label (boolean, optional)
*
**********/

import { Label } from 'components/lib';
import Style from './radio.tailwind.js';

export function Radio(props){

  const option = props.option.value || props.option;
  const label  = props.option.label || props.option;

  return (
    <div className={ Style.radio }>

      <input
        type='radio'
        name={ props.name }
        id={ option }
        value={ option }
        className={ Style.input }
        checked={ props.checked ? 'checked' : '' }
        onChange={ e => props.callback(props.index, props.checked, option)
        }
      />

      <Label
        text={ label }
        required={ props.required }
        for={ option }
        className={ Style.label }
      />
    </div>
  );
}