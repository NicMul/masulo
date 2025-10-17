const Style = {

  list: 'list-none',
  ulitem: `relative pl-6 mb-2 leading-6 before:content-[''] before:rounded-full
    before:bg-blue-500 before:w-2 before:h-2 before:absolute before:top-1/2
    before:left-0 before:-translate-y-1/2`,
  ol: '[counter-reset:section]',
  olitem: `mb-4 leading-6 before:relative before:[content:counters(section,'.')]
    before:inline-block before:[counter-increment:section] before:text-xs
    before:w-5 before:h-5 before:mr-2 before:text-white before:leading-5
    before:text-center before:bg-brand-500 before:rounded-full before:top-[-0.1em]`
}

export default Style;