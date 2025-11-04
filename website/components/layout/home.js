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

const gradientStyles = {
  animatedBackground: `
    fixed inset-0 z-0
    bg-[#0f0f1a]
    bg-[length:200%_200%]
    animate-[gradientShift_20s_ease-in-out_infinite]
    pointer-events-none
  `
};

const backgroundStyle = {
  backgroundImage: `
    radial-gradient(circle at 20% 30%, rgba(143, 143, 247, 0.5) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(62, 62, 107, 0.8) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(106, 106, 184, 0.6) 0%, transparent 50%),
    radial-gradient(circle at 90% 20%, rgba(84, 84, 145, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 10% 90%, rgba(99, 99, 172, 0.5) 0%, transparent 50%)
  `
};

export function HomeLayout(props){

  return (
    <div className={ font.className }>
      
      {/* Animated Background Gradient */}
      <div className={ gradientStyles.animatedBackground } style={ backgroundStyle } />
      
      <main className="relative z-10">
      
        <Nav transparent={ props.transparent } />
        
        { props.children }
       
      </main>
      
      <Footer/>
    </div>
  );
}
