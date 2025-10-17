/***
*
*   TESTIMONIAL
*   Create a testimonial with a quote, author image and name
*
*   PROPS
*   author: name of the author (string, optional)
*   image - imported image object (image, optional)
*   role: authors role (string, required)
*   text: the quotation (string, required)
*   url: link to authors site (string, optional)
*
**********/

import { Image } from 'components/lib';
import Style from './testimonial.tailwind.js';

export function Testimonial(props){

  return(
    <div className={ Style.testimonial }>

      <blockquote>

        <p>"{ props.text }"</p>
                          
        <footer className={ Style.footer }>

          { props.image &&
            <div className={ Style.avatar }>
              <Image 
                width='50'
                height='50'
                priority='true'
                placeholder='blur'
                src={ props.image }
                alt={ props.image }
                className={ Style.image } 
                /> 
            </div> }
          
            <cite className={ Style.cite }>

              { props.url ?
                <a href={ props.url } className={ Style.author }>{ props.author }</a> :
                <div className={ Style.author }>{ props.author }</div> }

              <div className={ Style.role }>{ props.role }</div>
            </cite>

        </footer>

      </blockquote>
    </div>
  );
}