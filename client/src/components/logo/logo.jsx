/***
*
*   LOGO
*   Replace the images in /public/assets with your own logo.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/logo
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   color: toggle between brand color or white logo (string, optional, default: white)
*   mark: use logo mark or full logo (boolean, optional: default: full logo)
*
**********/

import { useContext } from 'react';
import { AuthContext, Link, cn } from 'components/lib';
import LogoWhite from '/assets/logo/logo-white.svg';
import LogoMarkWhite from '/assets/logo/logo-mark-white.svg';
import LogoColor from '/assets/logo/logo-color.svg';
import LogoMarkColor from '/assets/logo/logo-mark-color.svg';

export function Logo({ className, color, mark }){

  const authContext = useContext(AuthContext);
  const darkMode = authContext?.user?.dark_mode;

  // force white on dark mode
  if (darkMode)
    color = false;

  const Logo = {
    color: {
      logo: LogoColor,
      mark: LogoMarkColor 
    },
    white: {
      logo: LogoWhite,
      mark: LogoMarkWhite
    }
  }
  
  return(
    <Link url='/' className={ cn('block mx-auto outline-none', className) }>
      <img src={ Logo[color ? 'color' : 'white'][mark ? 'mark' : 'logo'] } alt='Logo' />
    </Link>
  )
}
