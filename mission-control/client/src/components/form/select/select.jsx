/***
*
*   SELECT
*   Dropdown select used within the form
*   Props are passed from the form
*   
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   default: default selected option (string, optional)
*   errorMessage: custom error message (string, optional)
*   label: input label (string, optional)
*   name: name of the input to be used as the label (string, required)
*   onChange: callback function that executes on change (function, required)
*   options: array of object options (array, required)
*   required: this input is required (boolean, optional)
*   valid: determines if the input is valid (boolean, required)
*   value: initial value (string, optional)
*   warning: warning highlight (boolean, optional)
*
**********/

import { Label, Error, ClassHelper } from 'components/lib';
import Style from './select.tailwind.js';

export function Select(props){

  let options = props.options;
  const error = props.errorMessage || 'Please select an option';

  // set the default
  if (!props.default && options?.length){

    // if theres no default, show a please select option
    if (options && options[0]?.value === 'unselected') options.shift(0);
    options.unshift({ value: 'unselected', label: 'Please select an option' });

  }

  function change(e){

    let value = e ? e.target?.value : 'unselected';
    let valid = undefined;

    // validate
    valid = props.required && value === 'unselected' ? false : true;
    props.onChange(props.name, value, valid);
    props.callback && props.callback(value)

  }

  const wrapperStyle = ClassHelper(Style, {

    className: props.className, 
    success: props.valid === true,
    errorWrapper: props.valid === false, 
    warningWrapper: props.warning,

  });

  const selectStyle = ClassHelper(Style, {

    select: true, 
    error: props.valid === false,
    warning: props.warning,

  });

  return(
    <div className={ Style.input }>

      <Label
        text={ props.label }
        required={ props.required }
        for={ props.name }
      />

      <div className={ wrapperStyle }>

        <select
          className={ selectStyle }
          defaultValue={ props.default }
          onChange={ e => change(e) }
          id={ props.name }>

          { options?.map(option => {
            return (
              <option
                key={ option.value }
                value={ option.value }>
                { option.label }
              </option>
            );
          })}

        </select>

        { props.valid === false && <Error message={ error } className={ Style.message }/> }

      </div>
    </div>
  );
}