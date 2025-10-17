/***
*
*   LABEL
*   Form link
*   Create a link to another page within a form
*
*   PROPS
*   url: url (string, required)
*   text: label text (string, required)
*   
**********/

import { Link } from 'components/lib';
import Style from './link.tailwind.js';

export function FormLink(props){

  return (
    <Link 
      url={ props.url } 
      text={ props.text } 
      className={ Style.link }
    />
  );
}