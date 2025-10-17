/***
*
*   LOADER
*   Infinite spinning animation for loading states
*
**********/

import Orbit from './images/orbit.svg';
import { ClassHelper } from 'components/lib';
import NextImage from 'next/image';
import Style from './loader.tailwind.js';

export function Loader(props){

  const loaderStyle = ClassHelper(Style, props);

  return (
    <div className={ loaderStyle }>
      <NextImage src={ Orbit } className={ Style.orbit } alt='Orbit Spinner'/>
    </div>    
  );
}