import { cva } from 'components/lib';

const buttonVariants = cva(

  `inline-flex items-center justify-center whitespace-nowrap rounded-md 
   font-medium ring-offset-white transition-colors 
   focus-visible:outline-none 
   focus-visible:ring-2 
   focus-visible:ring-slate-200 
   focus-visible:ring-offset-2 
   disabled:pointer-events-none 
   disabled:opacity-50 
   dark:ring-offset-slate-200 
   dark:focus-visible:ring-slate-300`,

  {
    variants: {
      variant: {
        default: 
          `relative bg-slate-900 text-slate-50 hover:bg-slate-900/90 
           dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90`,
        destructive:
          `bg-red-500 text-slate-50 hover:bg-red-500/90 dark:bg-red-700 
           dark:text-slate-50 dark:hover:bg-red-700/90`,
        outline:
          `border border-slate-200 text-slate-700 bg-transparent hover:bg-slate-100 
           hover:text-slate-900 dark:border-slate-600 dark:hover:bg-primary
           dark:hover:border-primary dark:hover:text-slate-50 dark:text-slate-50`,
        ghost: 
          `hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-700 
           dark:hover:text-slate-50`,
        icon: 
          '!w-5 !h-5 rounded-none',
        link: 
          'text-slate-900 underline-offset-4 h-auto hover:underline dark:text-slate-50',
        rounded:
          `bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-50 
           dark:text-slate-900 dark:hover:bg-slate-50/90 rounded-full`, 
        naked: 
          `!hover:text-inherit !focus-visible:outline-none !focus-visible:ring-0 
          !p-0 !m-0 !h-auto !w-auto !rounded-none !font-normal !text-base !leading-normal`
      },
      size: {
        default: `h-10 px-4 py-2`,
        xs: 'h-7 rounded-md px-3',
        sm: `h-9 rounded-md px-3`,
        lg: `h-11 rounded-md px-8`,
        full: 'h-10 !w-full',
        icon: 'h-10 w-10',
      },
      color: {
        red: 
          'bg-red-500 hover:bg-red-500/90 dark:bg-red-500 dark:text-white dark:hover:bg-red-500/90',

        blue: 
          'bg-blue-500 hover:bg-blue-500/90 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-500/90',

        green: 
          'bg-emerald-500 hover:bg-emerald-500/90 dark:bg-emerald-5000 dark:text-white dark:hover:bg-emerald-500/90',

        orange: 
          'bg-orange-500 hover:bg-orange-500/90 dark:bg-orange-500 dark:text-white dark:hover:bg-orange-500/90',

        primary: 
          'bg-primary hover:bg-primary/90 dark:bg-primary dark:text-white dark:hover:bg-primary/90'
      }
    },
    defaultVariants: {
      variant: `default`,
      size: `default`,
    },
  }
)

export default buttonVariants