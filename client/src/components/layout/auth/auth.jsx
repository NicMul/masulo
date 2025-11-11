/***
*
*   AUTH LAYOUT
*   Layout for the signup/signin pages.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/layout
*
*   PROPS
*   children: child view (component(s), required)
*
**********/

import { Animate, Logo } from 'components/lib';

export function AuthLayout({ children }){

  return (
    <main className='flex min-h-screen bg-white dark:bg-slate-900'>
      <section className='flex flex-col w-full sm:w-1/2 p-12 [&>p]:-mt-2 [&_p]:mb-5 [&_p]:leading-5 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:mb-6 [&_h1]:text-primary [&_h1]:text-center dark:[&_h1]:text-slate-50'>
        
        <Logo color className='ml-0 w-32 mb-8 sm:hidden' />

        <div className='max-w-96 mx-auto w-full flex flex-col flex-grow items-center justify-center [&_form]:mb-4 [&_footer]:flex [&_footer]:gap-x-1 [&_footer]:mt-6 [&_footer]:border-t [&_footer]:pt-5 [&_footer]:border-t-slate-50 [&_figure]:relative [&_footer]:dark:border-t-slate-800 [&_footer]:dark:text-slate-400'>
          <Animate type='pop'>
          { children }
          </Animate>
        </div>

      </section>
      <section className='hidden sm:flex flex-col bg-primary w-1/2 p-12 pb-6 justify-between items-center'>

        { /* optional: add a cool visual here */ }
        <div className='text-white max-w-96 text-lg text-opacity-80 my-auto'>
          <blockquote>
            "Mesulo provided the foundation to jumpstart my SaaS product. 
            The attention to detail, thoughtful approach, and creative 
            inclination provided the most ideal outcome. 
            In my capacity as a UX Lead at Apple I've worked 
            with countless engineers — of which Mesulo stands ahead 
            of the pack. I hope to continue leveraging Mesulo 
            long into the future."
            <cite className='block mt-4'>- Brat Bitler, Designer at Apple</cite>
          </blockquote>
        </div>

        <Logo className='w-36 mr-0 mt-auto'/>

      </section>
    </main>
  );
}