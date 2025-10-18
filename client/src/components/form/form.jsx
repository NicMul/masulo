/***
*
*   FORM
*   Self-validating form that accepts an object for inputs
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/form
*   https://ui.shadcn.com/docs/components/form
*
 *   PROPS
 *   buttonText: submit button text (string, required)
 *   callback: function executed on successful submit (function, optional)
 *   cancel: cancel callback - renders a cancel button (boolean, optional)
 *   className: custom styling (SCSS or tailwind style, optional)
 *   destructive: set submit button color to red (boolean, optional)
 *   gridCols: number of columns for grid layout (integer, optional, default: 2)
 *   inputs: object containing the form inputs (object, required)
 *   layout: layout type - 'grid' for multi-column or default single column (string, optional)
 *   method: HTTP request type (string, optional)
 *   onChange: callback function executed on change in ...props (boolean, optional)
 *   redirect: url to redirect to after a successful submit (string, optional)
 *   submitOnChange: submit the form on each change (boolean, optional)
 *   url: url to post the form to (string, optional)
*
**********/

import { useState, useEffect, useContext, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Axios from 'axios';

import { Label, Error, Description, Icon, Button, 
  ViewContext, useNavigate, cn, useTranslation, Grid } from 'components/lib'

import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

import Inputs from './input/map'

function Form({ inputs, url, method, submitOnChange, callback, redirect, className, buttonText, 
  destructive, cancel, layout, gridCols, ...props }){

  const { control, handleSubmit, setValue, setError, trigger, unregister, watch,
    formState: { errors, touchedFields } 
  } = useForm({ mode: 'onBlur' });  

  const viewContext = useContext(ViewContext);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  // init default values
  useEffect(() => {

    inputs && Object.keys(inputs).length &&
    Object.keys(inputs).forEach(key => {

      const input = inputs[key];

      if (!watch(key)) {
        setValue(key, input.defaultValue || input.value);
      }

    });
  }, [setValue, inputs]);

  // handle external inputs prop change
  useEffect(() => {

    inputs && Object.keys(inputs).length &&
    Object.keys(inputs).forEach(key => {

      // unregister input if it's hidden
      if (inputs[key].type === null)
        unregister(key);

    });
  }, [inputs]);

  // watch for changes
  useEffect(() => {

    const subscription = watch(async (data) => {

      // uncomment me to watch changes
      // console.log('watch', data);
      
      if (submitOnChange)
        handleSubmit(submit)();

    });

    return () => subscription.unsubscribe();
      
  }, [handleSubmit, watch]);

  const onChange = useCallback(async (e, field) => {

    // internal handler
    field.onChange(e) 
    
    // external handler to react to input changes
    if (props.onChange){

      const valid = await trigger(field.name); // validate field
      props.onChange({ input: field.name, value: e.target.value, valid: valid });

    }
  }, [props.onChange]);

  const submit = useCallback(async (data) => {

    // console.log('submit.data', data)
    const valid = await trigger();

    // validate
    if (!valid){

      setLoading(false);
      return false;

    }

    // no url - use callback instead of action
    if (!url)
      return callback?.(null, data);

    // start loading
    setLoading(true);
  
    try {

      let headers, payload;

      // generate a credit card token 
      if (data.token){

        const cardElement = props.elements.getElement(CardElement);
        const { token } = await props.stripe.createToken(cardElement);
        data.token = token

      }

      // handle files
      if (Object.values(data).some(value => value instanceof FileList)){

        // prepare form data for file upload
        headers = { 'Content-Type': 'multipart/form-data' };
        payload = new FormData();

        Object.keys(data).forEach(key => {

          data[key] instanceof FileList ? 
            Array.from(data[key]).forEach(file => payload.append(key, file)) : 
            payload.append(key, data[key]);

        });
      } 
      else {

        // prepare json payload for non file forms
        headers = { 'Content-Type': 'application/json' };
        payload = JSON.stringify(data);

      }

      // submit the form
      let res = await Axios({ method, url, data: payload, headers });

      // handle stripe callback?
      if (res.data.requires_payment_action){

        res = await props.stripeCallback({ formData: data, resData: res.data });

      }

      setLoading(false);

      if (!res) 
        return false; // end execution – error was handled 

      // show message
      if (res.data.message)
        viewContext.notification({ description: res.data.message });

      // execute callback (send res and local data)
      callback?.(res, data);

      // redirect
      if (redirect)
        navigate(redirect);

    }
    catch (err){

      // handle error
      setLoading(false);
      console.error(err);

      // input or generic error
      if (err.response?.data){

        const input = err.response.data.inputError;
        const message = err.response.data.message;

        input ? 
          setError(input, { type: 'server', message: message }) :
          viewContext.handleError(err); 

      }
    }
  }, [callback, viewContext.notification, navigate, trigger, url, method, redirect, props.stripeCallback]);

  // Render input field component
  const renderInput = (name) => {
    const { type, required, label, errorMessage, min, max, 
      minLength, maxLength, placeholder, description, value, 
      defaultValue, options, disabled, validation, accept, readonly } = inputs[name];

    // ignore null input type
    if (inputs[name].type === null)
      return false;

    // input type to render or default generic input
    // imported from ./input/map.js file
    const Input = Inputs[type] ? Inputs[type] : Inputs.default;

    return (
      <div className={ cn(type !== 'hidden' && 'mb-4 last:mb-0') } key={ name }>

        { label && Input.showLabel &&
          <Label htmlFor={ name } required={ required }>{ label }</Label> }

        <div className='relative'>
          <Controller
            name={ name }
            control={ control }
            defaultValue={ value || defaultValue || '' }
            rules={{

              // validation
              required: required ? 
                (errorMessage || t('global.form.input.error.required', 
                { label: label || 'Field' })) : undefined,

              min: min ? 
                { value: min, message: (errorMessage || t('global.form.input.error.min', 
                { min }))} : undefined,

              max: max ? 
                { value: max, message: (errorMessage || t('global.form.input.error.max', 
                { label, max }))}: undefined,

              minLength: minLength ? 
                { value: minLength, message: (errorMessage || t('global.form.input.error.min_length', 
                { label, minLength }))} : undefined,

              maxLength: maxLength ? 
                { value: maxLength, message: (errorMessage || t('global.form.input.error.max_length', 
                { label, maxLength }))} : undefined,

              // input specific default
              ...Input.validation ?
                { pattern: { value: Input.validation.default, message: errorMessage || t(`global.form.${type}.error.invalid`,
                { label, type })}} : {},

              // input specific passed as prop
              ...Object.keys(validation || {}).reduce((acc, key) => {

                if (validation[key] === true && Input.validation?.[key]) {
                  acc.pattern = { value: Input.validation[key], message: errorMessage || t(`global.form.${type}.error.invalid`, 
                  { label, type })};
                }

                return acc;
                }, {}
              )
            }}
            render={({ field }) => (
              <Input.component
                {...field }
                id={ name }
                options={ options }
                label={ label }
                type={ type }
                accept={ accept }
                readOnly={ readonly }
                disabled={ disabled }
                placeholder={ placeholder }
                onChange={ e => onChange(e, field) }
                defaultChecked={ defaultValue }
                defaultValue={ defaultValue }
                value={ field.value }
                aria-describedby={ errors[name] ? `${name}-helper ${name}-error` : `${name}-helper` }
                aria-invalid={ !!errors[name] }
              />
            )}
          />

          { /* success/error icon */ }
          { touchedFields[name] && Input.showIcon &&
            <Icon 
              size={ 14 }
              className='absolute top-1/2 transform -translate-y-1/2 right-2'
              name={ errors[name] ? 'x' : 'check' }
              color={ errors[name] ? 'red' : 'green' } 
            /> 
          }

        </div>

        { /* error message */ }
        { errors[name] && type != 'hidden' &&
          <Error id={ `${name}-error` }>{ errors[name].message }</Error> 
        }

        {  /* description helper */ }
        { description && !errors[name] &&
          <Description id={ `${name}-helper` }>
            { description }
          </Description> 
        }

      </div>
    );
  };

  return (
    <form onSubmit={ handleSubmit(submit) } className={ cn(loading && 'opacity-50 pointer-events-none', className)} noValidate>

      { layout === 'grid' ? (
        <Grid max={ gridCols || 2 }>
          { inputs && Object.keys(inputs).length &&
            Object.keys(inputs).map(name => renderInput(name))
          }
        </Grid>
      ) : (
        // Original single column layout
        inputs && Object.keys(inputs).length &&
        Object.keys(inputs).map(name => renderInput(name))
      )}
  
      { /* submit button */ }
      { buttonText &&
        <Button
          type='submit'
          loading={ loading }
          text={ buttonText }
          color={ destructive ? 'red' : 'primary' }
          className='w-[49%] mr-[2%] last:mr-0'
          size={ cancel ? 'default' : 'full' }
        />
      }

      { /* cancel button */ }
      { cancel &&
        <Button 
          variant='outline' 
          text='Cancel' 
          className='w-[49%] mr-[2%] last:mr-0'
          action={ cancel } 
        />
      }

    </form>
  );
}

function PaymentForm(props){

  const stripe = useStripe();
  const elements = useElements();
  const viewContext = useContext(ViewContext);

  async function handleStripeCallback({ formData, resData }){

    // check for 2-factor payment requirement
    if (resData.requires_payment_action){

      try {

        const { error } = await stripe.handleCardPayment(resData.client_secret);
        if (error) throw error;

        return await Axios({ 
          
          method: props.method,
          url: props.url, 
          data: { ...formData, ...{ stripe: resData }}

        });
      }
      catch (err){

        viewContext.handleError(err);

      }
    }
  }

  return (
    <Form 
      {...props } 
      stripe={ stripe } 
      elements={ elements }
      stripeCallback={ handleStripeCallback }
    />
  );
}

export { Form, PaymentForm }