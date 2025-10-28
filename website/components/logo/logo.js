/***
*
*   LOGO
*   Replace the images in /images with your own logo
*
*   PROPS
*   color: toggle between brand color or white logo (string, optional, default: white)
*   mark: use a logo mark or full logo (boolean, optional: default: full logo)
*
**********/

import React from 'react';
import Link from 'next/link';
import Image from 'next/legacy/image';
import { ClassHelper } from 'components/lib';

import LogoLight from './logo-white2.svg';
import LogoDark from './logo-color2.svg';

import Style from './logo.tailwind.js';

export function Logo(props){

  const css = ClassHelper(Style, {

    logo: true,
    className: props.className

  });

  const logo = {

    light: LogoLight,
    dark: LogoDark,

  }

  return (
    <Link href='/' className={ css }>
      <Image src={ logo[props.image] || logo.light  } alt='Gravity | Node.js SaaS boilerplate' />
    </Link>
  )
}
