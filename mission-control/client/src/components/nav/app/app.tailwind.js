const Style = {

  nav: `fixed top-2 left-4 z-50 bg-transparent md:top-0 md:left-0 md:w-20 md:h-full md:bg-slate-800 
    md:transition-all md:ease-in-out md:duration-200`,

  logo: 'hidden absolute top-5 left-6 !w-8 !h-8 md:block',
  open: `!block`,
  
  expanded: `!w-52 [&_span]:opacity-100 md:[&_span]:transition-all md:[&_span]:transition-ease-in-out md:[&_span]:delay-100`,
  links: `hidden fixed z-10 top-2 left-2 p-4 pt-10 bg-white rounded shadow-md transition-all ease-in-out delay-200
    md:block md:relative md:bg-transparent md:pt-0 md:mt-20 md:rounded-none md:top-0 md:left-0 md:shadow-none`,
  
  link: `relative inline-block float-none text-slate-500 p-0 mb-3 !w-full no-underline last:mb-0
    md:block md:text-white md:h-12 md:leading-[3em] md:mb-1 hover:cursor-pointer`,

  link_active: `md:text-white md:bg-slate-700 md:rounded`,
  
  label: 'ml-6 md:ml-12 md:opacity-0 md:pointer-events-none',
  icon: `absolute top-1/2 -translate-y-1/2 md:left-4`,
  toggle: `absolute left-0 top-[3px] z-30 md:hidden`,

}

export default Style;