/***
*
*   HOME LAYOUT
*   Main layout component
*
*   PROPS
*   children: will be passed from router > view > here (component(s), required)
*   transparent: render a transparent nav (boolean, optional)
*
**********/

import { Nav, Footer } from 'components/lib';
import { Source_Sans_3 } from 'next/font/google';
const font = Source_Sans_3({ weight: ['400', '500', '600', '700', '800'], subsets: ['latin'] });

export function HomeLayout(props){

  return (
    <div className={ font.className }>
      <main>

        <Nav transparent={ props.transparent } />
        { props.children }

      </main>
      <Footer/>
    </div>
  );
}
