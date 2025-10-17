/***
*
*   HEADER
*   Section break in a form
*
*   PROPS
*   label: description label (string, optional)
*   title: title of the section (string, optional)
*
**********/

import Style from './header.tailwind.js';

export function FormHeader(props){

  return(
    <header className={ Style.header }>

      { props.title && 
        <h2>{ props.title } </h2> }

      { props.label && 
        <p className={ Style.label }>
         { props.label }
        </p> 
      }

    </header>
  );
}