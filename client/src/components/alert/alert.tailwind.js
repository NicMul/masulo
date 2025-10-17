import { cva } from 'components/lib';

const Variants = cva(
  
  `relative w-full rounded-lg border border-slate-200 
  p-6 pl-14 [&>p]:!mb-0 
  [&>svg]:left-6 
  [&>svg]:top-[1.65em] 
  [&>svg]:text-slate-950 
  [&>svg+div]:translate-y-[-3px] 
  [&>svg]:absolute 
  dark:border-slate-800 
  dark:[&>svg]:text-slate-50 
  [&>h2]:font-semibold 
  [&>h2]:text-lg
  [&>p]:leading-relaxed 
  [&>button]:mt-2`,

  {
    variants: {
      variant: {
        default: 
          'bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-50',
        info: 
          `bg-blue-100 border-blue-500/50 text-blue-500 [&>svg]:text-blue-500 
          dark:border-blue-500 dark:border-blue-900/50 dark:text-blue-900 
          dark:dark:border-blue-900 dark:[&>svg]:text-blue-900`,
        success: 
          `bg-emerald-100 border-emerald-500/50 text-emerald-600 
          [&>svg]:text-emerald-500 dark:border-emerald-500 
          dark:border-emerald-900/50 dark:text-emerald-900 
          dark:dark:border-emerald-900 dark:[&>svg]:text-emerald-900`,
        warning: 
          `bg-orange-100 border-orange-500/50 text-orange-600 
          [&>svg]:text-orange-500 dark:border-orange-500 
          dark:border-orange-900/50 dark:text-orange-900 
          dark:dark:border-orange-900 dark:[&>svg]:text-red-900`,
        error: 
          `bg-red-100 border-red-500/50 text-red-600 
          [&>svg]:text-red-500 dark:border-red-500 
          dark:border-red-900/50 dark:text-red-900 
          dark:dark:border-red-900 dark:[&>svg]:text-red-900`,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export { Variants }