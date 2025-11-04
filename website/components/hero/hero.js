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

import { useState, useEffect, useRef } from 'react';
import { Row, ButtonGroup, Image, Rating, Video } from 'components/lib';
import Style from './hero.tailwind.js';

export function Hero(props){

  const visualRef = useRef(null);
  const [transform, setTransform] = useState('translateY(0px)');

  useEffect(() => {
    const handleScroll = () => {
      if (!visualRef.current) return;
      
      const scrollY = window.scrollY || window.pageYOffset;
      const elementTop = visualRef.current.getBoundingClientRect().top + scrollY;
      const windowHeight = window.innerHeight;
      
      // Calculate parallax effect - moves slower than scroll
      // Only animate when element is visible in viewport
      if (scrollY < elementTop + windowHeight && scrollY > elementTop - windowHeight) {
        const offset = (scrollY - elementTop) * 0.1; // 0.3 is the parallax speed
        setTransform(`translateY(${offset}px)`);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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

      <div 
        ref={visualRef}
        className={ Style.visual }
        style={{ 
          transform: transform,
          transition: 'transform 0.1s ease-out',
          willChange: 'transform'
        }}
      >

        { props.image && 
          <Image className={ Style.visual } {...props.image } /> }

        { props.video && 
          <Video className={ Style.visual } {...props.video } /> }

      </div>
    </Row>
  )
}