/***
*
*   HIDDEN INPUT
*   For passing hidden data to the server in a form
*   Props are passed from the form
*
*   PROPS
*   name: input name (string, required)
*   value: initial value (string, optional)
*   
**********/

export function HiddenInput(props){

  return(
    <input
      type='hidden'
      id={ props.name }
      name={ props.name }
      value={ props.value || '' }
    />
  );
}
