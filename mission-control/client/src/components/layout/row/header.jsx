/***
*
*   ROW HEADER
*   The title and description of the row
*
*   PROPS
*   desc: description below the title (string, optional)
*   mainTitle: the main title of the row (string, optional)
*   title: the title of the row (string, required)
*
**********/

import { Fragment } from 'react';
import { ClassHelper } from 'components/lib';
import Style from './header.tailwind.js';

export function RowHeader(props){

  const showHeader = props.title ? true : false;

  const textStyle = ClassHelper(Style, {

    title: props.mainTitle,
    subtitle: !props.mainTitle,

  })

  return (
    <Fragment>
      { showHeader &&
        <header className={ Style.header }>

          { props.mainTitle ?
            <h1 className={ textStyle }>
              { props.mainTitle }
            </h1> :
            <h2 className={ textStyle }>
              { props.title }
            </h2>
          }

          { props.desc && <p className={ Style.desc }>{ props.desc }</p> }
        </header>
      }
    </Fragment>
  )
}