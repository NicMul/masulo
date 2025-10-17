/***
*
*   CARD
*   Universal container for grouping UI components together
*
*   PROPS
*   center: align the card in the center (boolean, optional)
*   className: custom class (SCSS or tailwind style, optional)
*   children: children to render (component(s), required)
*   last: remove bottom margin on last card (boolean, optional)
*   loading: toggle the loading animation (boolean, optional)
*   noPadding: remove the padding (boolean, optional)
*   number: show a number in the title (integer, optional)
*   restrictWidth: restrict the width of the card on large screens (boolean, optional)
*   shadow: apply a box shadow (boolean, optional)
*   title: title (string, optional)
*   transparent: remove background colour (boolean, optional)
*
**********/

import { Loader, ClassHelper } from 'components/lib';
import Style from './card.tailwind.js';

export function Card(props){

  const cardStyle = ClassHelper(Style, {

    card: true,
    shadow: props.shadow, 
    center: props.center, 
    noPadding: props.noPadding,
    loading: props.loading,
    className: props.className,
    last: props.last,
    restrictWidth: props.restrictWidth, 
    transparent: props.transparent

  });

  return (
    <section className={ cardStyle } style={ props.style || props.undefined }>

      { props.title &&
        <header className={ Style.header }>

          <h1 className={ Style.title }>

            { props.number && 
              <span className={ Style.number }>
                { props.number }
              </span> } 

            { props.title }

          </h1>

        </header> }

      { props.loading ?
        <Loader /> :
        props.children
      }
    </section>
  );
}