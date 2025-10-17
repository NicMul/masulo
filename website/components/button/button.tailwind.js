const ButtonStyle = {

  base: 'cursor-pointer uppercase',
  btn: 'block text-center font-semibold rounded px-16 py-3 ease-in-out duration-500 text-white text-md sm:text-lg',
  big: 'md:text-xl',
  small: '!text-sm !px-6 !py-2',
  outline: 'text-slate-700 border-solid border border-slate-300 hover:!text-white hover:border-slate-500 hover:bg-slate-500 bg-transparent',
  green: 'bg-emerald-500 hover:bg-emerald-600',
  red: 'bg-red-500 hover:bg-red-600 hover:border-red-500',
  blue: 'bg-blue-500 hover:bg-blue-600 hover:border-blue-600',
  orange: 'bg-orange-500 hover:bg-orange-600 hover:border-orange-600',
  textOnly: 'text-slate-500',
  iconButton: 'relative inline-block p-0 w-4 h-4',
  iconText: 'pl-12',
  iconTextOnly: 'pl-6',
  fullWidth: '!w-full',
  rounded: 'rounded-full',
  alignLeft: 'pl-6 pr-0',
  alignRight: 'pl-0 pr-6',
  loading: `relative after:absolute after:w-4 after:h-4 after:right-1 after:top-4 after:z-10 
    after:bg-[url('/images/icons/ico-loader.svg')] after:bg-contain after:right-3 after:origin-center after:animate-loading`,

}

export default ButtonStyle;