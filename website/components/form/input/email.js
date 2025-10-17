/***
*
*   EMAIL INPUT
*   Email type input
*   Props are passed from the form
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   disabled: disable input (boolean, optional)
*   errorMessage: custom error message (string, optional)
*   label: input label (string, optional)
*   name: input name (string, required)
*   onChange: callback function that executes on change (function, required)
*   placeholder: placeholder value (string, optional)
*   required: this input is required (boolean, optional)
*   value: initial value (string, optional)
*   valid: determines if the input is valid (boolean, required)
*   warning: warning highlight (boolean, optional)
*   
**********/

import { Label, Error, Icon, ClassHelper } from 'components/lib';
import Style from './input.tailwind.js';

export function EmailInput(props){

  let error = props.errorMessage || 'Please enter a valid email address';

  function validate(e){

    let value = e ? e.target.value : '';
    let valid = undefined;

    // input is required and value is blank
    if (props.required && value === '')
      valid = false;

    // input isn't required and value is blank
    if (!props.required && value === '')
      valid = true;

    // now test for a valid email
    const rex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    valid = rex.test(value);

    // update the parent form
    props.onChange?.(props.name, value, valid);

  }

  // style
  const emailStyle = ClassHelper(Style, {

    textbox: true,
    className: props.className,
    error: props.valid === false, 
    success: props.valid === true,
    warning: props.warning,

  });

  return(
    <div className={ Style.input }>

      { props.label && 
        <Label
          text={ props.label }
          required={ props.required }
          for={ props.name }
        /> }

      <input
        type={ props.type }
        id={ props.name }
        name={ props.name }
        className={ emailStyle }
        value={ props.value || '' }
        placeholder={ props.placeholder }
        onChange={ e => props.onChange?.(props.name, e.target.value, undefined) }
        onBlur={ e => validate(e) }
      />

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
