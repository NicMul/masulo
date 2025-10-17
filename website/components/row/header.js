/***
*
*   ROW HEADER
*   The title and description of the row
*
*   PROPS
*   desc: description below the title (string, optional)
*   title: the title of the row (string, required)
*
**********/
import { Fragment } from 'react';
import Style from './header.tailwind.js';

export function RowHeader(props){

  return (
    <Fragment>
      { props.title &&
        <header className={ Style.header }>

          <h2 className={ Style.title }>
            { props.title }
          </h2>

          { props.desc && 
            <p className={ Style.desc }>
              { props.desc }</p> }

        </header>
      }
    </Fragment>
  )
}