const Style = {

  list: 'list-none mb-6',
  ulitem: `relative pl-5 mb-2 leading-6 before:content-[''] before:rounded-full
    before:bg-slate-500 before:w-2 before:h-2 before:absolute before:top-2
    before:left-0`,

  ol: '[counter-reset:section]',
  olitem: `relative mb-4 pl-8 leading-6 before:absolute before:content-[counter(section)] 
    before:inline-block before:[counter-increment:section] before:text-xs before:w-5 
    before:h-5 before:mr-2 before:text-white before:leading-5 before:text-center 
    before:bg-slate-500 before:rounded-full before:top-[0.2em] before:left-[0]`

}

export default Style;