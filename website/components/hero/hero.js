/***
*
*   HERO
*   Hero section on landing page
*
*   PROPS
*   actions: array of buttons (array, optional)
*   image: hero image (image object, optional)
*   rating: rating for social proof
*   subtitle: h2 tagline (string, required)
*   title: h1 title (string, required)
*   video: embedded video (video object, optional)
*
**********/

import { Row, ButtonGroup, Image, Rating, Video } from 'components/lib';
import Style from './hero.tailwind.js';

export function Hero(props){

  return (
    <Row color='dark' className={ Style.hero } >

      <section className={ Style.blurb }>

        <h1 className={ Style.title }>{ props.title }</h1>

        { props.subtitle && 
          <h2 className={ Style.subtitle }>{ props.subtitle }</h2> }

        { props.actions.length && 
          <ButtonGroup buttons={ props.actions } className={ Style.actions } /> }

        { props.rating && 
          <Rating 
            {...props.rating } 
            color={ 'light' }
            className={ Style.rating }
          /> }
                
      </section>

      <div className={ Style.visual }>

        { props.image && 
          <Image className={ Style.visual } {...props.image } /> }

        { props.video && 
          <Video className={ Style.visual } {...props.video } /> }

      </div>
    </Row>
  )
}