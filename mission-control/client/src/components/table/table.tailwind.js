const Style = {

  table: 'w-full border-separate -mb-6 mt-[-1.3em]',
  inputs: 'mb-5 md:flex',
  search: 'flex mb-2 md:mb-0 flex-1',
  loading: 'relative py-8',
  badge: 'ml-0',
  empty: 'py-3',
  thead: 'hidden font-semibold md:table-header-group',
  th_actions: 'text-right',
  th_select: '!pl-px w-4',

  th: `text-left outline-0 capitalize py-5 px-5 border-b border-dotted border-slate-100 
    first:pl-0 last:pr-0 dark:border-slate-700`,

  sort: `relative cursor-pointer after:absolute after:right-0 after:top-1/2 after:mt-[3px]
    after:w-3 after:h-3 after:opacity-50 after:-translate-y-1/2 after:bg-contain`,
    
  asc: `after:bg-[url('/assets/icons/ico-sort-asc-dark.svg')]
    dark:after:bg-[url('assets/icons/ico-sort-asc-light.svg')]`,

  desc: `after:bg-[url('assets/icons/ico-sort-dsc-dark.svg')]
    dark:after:bg-[url('assets/icons/ico-sort-dsc-light.svg')]`,

  cell: `float-left mt-3 mb-[-0.6em] w-full first:pl-0 
    md:float-none md:w-auto md:mt-0 md:mb-0 md:p-5 md:border-b md:border-solid md:border-slate-100
    dark:border-slate-700`,

  cell_empty: 'hidden md:table-cell',

  bulk_actions: 'flex', 
  bulk_actions_button: 'ml-2 first:ml-0 flex-1 md:first:ml-2 md:flex-initial',

  row_actions: `text-left float-left mt-4 w-full clear-left pb-4 whitespace-nowrap
    md:float-none md:clear-none md:w-auto md:text-right md:mb-0 md:pb-0 
    border-b border-slate-100 border-solid dark:border-slate-700`,

  row_actions_button: 'inline-block whitespace-nowrap -top-1 mr-3 bg-transparent last:mr-0',

  select: 'pt-4 align-top md:align-middle float-none !w-8 border-b border-slate-100 border-solid',
  select_all: 'float-left pl-[2px] pb-3 border-b border-slate-100 border-dotted w-full md:hidden',
  image: 'w-8 h-8 rounded'

}

export default Style;