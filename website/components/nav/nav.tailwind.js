const Style = {

  wrapper: '!py-10',
  nav: 'relative',
  desktop: 'hidden sm:block',
  mobile: 'fixed top-[1.2em] left-[0.75em] right-[0.75em] sm:hidden z-[100]',
  logo: 'absolute top-1/2 left-[0] m-0 -translate-y-1/2',
  links: 'p-6 text-left sm:text-center sm:p-0 sm:h-5 sm:leading-[1.3em]',
  link: `block text-slate-700 mb-4 sm:inline-block sm:text-white sm:p-0 
    sm:opacity-90 sm:hover:opacity-100 sm:mb-0 sm:mr-6 last-of-type:mr-0`,
  toggleButtonOpen: '!absolute top-1/2 right-[0.4em] z-100 sm:!hidden -translate-y-1/2',
  toggleButtonClosed: '!absolute right-[1em] top-[1em] z-100 sm:hidden',
  button: 'sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2',

}

export default Style;