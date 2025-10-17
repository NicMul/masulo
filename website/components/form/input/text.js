/***
*
*   TEXT INPUT
*   Text type input
*   Props are passed from the form
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   disabled: disable the input (boolean, optional)
*   errorMessage: custom error message (string, optional)
*   id: id of the input (string, optional)
*   label: input label (string, optional)
*   name: input name (string, required)
*   onChange: callback function that executes on change (function, required)
*   placeholder: placeholder value (string, optional)
*   required: determine if this input is required (boolean, optional)
*   valid: determines if the input is valid (boolean, required)
*   value: initial value (string, optional)
*   warning: warning highlight (boolean, optional)
*   
**********/

import { Label, Error, Icon, ClassHelper } from 'components/lib';
import Style from './input.tailwind.js';

export function TextInput(props){

  const error = props.errorMessage || 'Please enter a value';

  function validate(e){

    let value = e ? e.target.value : '';
    let valid = undefined;

    // input is required and value is blank
    if (props.required && value === '')
      valid = false;

    // input isn't required and value is blank
    if (!props.required && value === '')
      valid = true;

    if (props.required && value !== '')
      valid = true;

    // update the parent form
    props.onChange?.(props.name, value, valid);

  }

  // style
  const textStyle = ClassHelper(Style, {

    textbox: true, 
    className: props.className, 
    error: props.valid === false,
    success: props.valid === true,
    warning: props.warning

  });

  return(
    <div className={ Style.input }>

      { props.label && 
        <Label
          text={ props.label }
          required={ props.required }
          for={ props.name }
        /> }

      { props.type === 'textarea' ?

        <textarea
          id={ props.id }
          name={ props.name }
          value={ props.value }
          className={ textStyle }
          placeholder={ props.placeholder }
          onChange={ e => props.onChange?.(props.name, e.target.value, undefined) }
          onBlur={ e => validate(e) }
        >
        </textarea>

        :

        <input
          type='text'
          id={ props.id }
          name={ props.name }
          value={ props.value || '' }
          className={ textStyle }
          placeholder={ props.placeholder }
          onChange={ e => props.onChange?.(props.name, e.target.value, undefined) }
          onBlur={ e => validate(e) }
        />
      }

      { props.valid === false &&
        <Error message={ error }/> }

      { props.valid === true &&
        <Icon
          image='check'
          color='#8CC57D'
          className={ Style.successIcon }
          size={ 16 }
        />}

    </div>
  );
}
