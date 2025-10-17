/***
*
*   FORM
*   Self-validating form that accepts an object for inputs
*
*   PROPS
*   buttonText: submit button text (string, required)
*   callback: function to be executed on successful submit (function, optional)
*   cancel: show a cancel button (boolean, optional)
*   inputs: the object containing the form inputs (object, required)
*   method: HTTP request type (string, optional)
*   onChange: callback function fired when updateOnChange is used (boolean, optional)
*   redirect: url to redirect to after a successful submit (string, optional)
*   submitOnChange: submit the form on each change (boolean, optional)
*   updateOnChange: determine if onChange callback should fire each change (boolean, optional)
*   url: url to send the form to (string, optional)
*
**********/

import { useState, useEffect } from 'react';
import Axios from 'axios';
import { TextInput, EmailInput, HiddenInput, Button, ClassHelper } from 'components/lib'
import Style from './form.tailwind.js';

export function Form(props){

  let valid = true;

  // state
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // inputs map
  const Inputs = {

    text: TextInput,
    textarea: TextInput,
    email: EmailInput,
    hidden: HiddenInput,

  }

  useEffect(() => {

    // if the form is valid and using
    // live updates, refresh the form
    if (valid && props.updateOnChange){

      setForm(props.inputs);

    }

    // otherwise, only init if no form set
    else if (!form){

      setForm({...props.inputs });

    }
  }, [props, form, valid]);

  if (!form)
    return false;

  function update(input, value, valid){

    let data = {...form }

    // update input value & valid state
    data[input].value = value;
    data[input].valid = valid;
    setForm(data);
    
    props.updateOnChange &&
    props.onChange({ input: input, value: value, valid: valid });

    props.submitOnChange && submit();

  }

  function validate(){

    // loop over each input and check it's valid
    // show error if input is required and value is
    // blank, input validation will be executed on blur

    let errors = [];
    let data = {...form };

    // loop the inputs
    for (let input in data){

      let inp = data[input];
      if (inp.value === undefined && inp.default)
        data[input].value = inp.default;

      if (inp.required){
        if (!inp.value){

          inp.valid = false;
          errors.push(false);

        }
      }

      if (inp.valid === false){

        errors.push(false);

      }
    }
    
    if (errors.length){

      // form isn't valid
      valid = false;
      setForm(data);
      return false;

    }
    else {

      // form is valid
      return true;

    }
  }

  async function submit(){

    // submit the form
    setLoading(true);
    let data = {...form };

    // is the form valid?
    if (!validate()){

      setLoading(false);
      return false;

    }
      
    // optimise data for server
    for (let input in form)
      data[input] = form[input].value;

    // submit the form or execute callback
    if (!props.url){

      if (props.callback)
        props.callback(null);

      return false;

    }

    try {
   
      let res = await Axios({

        method: props.method,
        url: props.url,
        data: data

      });

      // finish loading
      setLoading(false);

      // callback?
      if (props.callback)
        props.callback(res);

      // redirect?
      if (props.redirect)
        navigate(props.redirect);

      // success notification
      if (res.data.message)
        context.notification.show(res.data.message, 'success', true);

    }
    catch (err){

      // handle error
      setLoading(false);

      // show error on input
      if (err.response?.data?.inputError){

        let data = {...form }
        const input = err.response.data.inputError;
        data[input].valid = false;
        data[input].errorMessage = err.response.data.message;
        valid = false;
        setForm(data);
        return false;

      }
    }
  }

  let inputsToRender = [];
  const formStyle = ClassHelper(Style, {...props, ...{
    
    loading: props.loading || loading

  }});

  // map the inputs
  Object.keys(form).map(name => {

    // get the values for this input
    const data = form[name];
    data.name = name;
    inputsToRender.push(data);
    return inputsToRender;

  });

  // render the form
  return(

    <form
      action={ props.action }
      method = { props.method }
      onSubmit={ submit }
      className={ formStyle }
      noValidate>

      { inputsToRender.map(input => {

        if (input.type === null)
          return false;

        if (!input.type)
          input.type = 'text';

        if (input.type === 'creditcard' && !processCreditCard)
          return false;

        const Input = Inputs[input.type];

        return (
          <Input
           key={ input.name }
           type={ input.type }
           form={ props.name }
           label={ input.label }
           className={ input.class }
           name={ input.name }
           value={ input.value }
           required={ input.required }
           valid={ input.valid }
           url={ input.url }
           text={ input.text }
           title={ input.title }
           description={ input.description }
           placeholder={ input.placeholder }
           errorMessage={ input.errorMessage }
           onChange={ update }
          />
        );
      })}

      { props.buttonText &&
        <Button
          color={ props.destructive ? 'red' : 'green' }
          loading={ loading }
          text={ props.buttonText }
          action={ submit }
          className={ Style.button }
          fullWidth={ !props.cancel }
        />
      }

      { props.cancel &&
        <Button 
          color={ props.destructive ? 'green' : 'red' } 
          outline 
          text='Cancel' 
          className={ Style.button }
          action={ props.cancel } 
        />
      }
    </form>
  );
}