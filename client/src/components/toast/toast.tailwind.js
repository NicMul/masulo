import { cva } from 'components/lib'

const Variants = cva(

  `group pointer-events-auto relative flex w-full items-center 
    justify-between space-x-4 overflow-hidden rounded-md 
    border border-slate-200 p-6 pr-4 shadow-lg transition-all 
    data-[swipe=cancel]:translate-x-0 
    data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] 
    data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] 
    data-[swipe=move]:transition-none 
    data-[state=open]:animate-in 
    data-[state=closed]:animate-out 
    data-[swipe=end]:animate-out 
    data-[state=closed]:fade-out-80 
    data-[state=closed]:slide-out-to-right-full 
    data-[state=open]:slide-in-from-top-full 
    data-[state=open]:sm:slide-in-from-bottom-full 
    dark:border-0 mb-2 bg-white`,

  {
    variants: {
      variant: {
        default: 
          'border bg-white text-slate-950 dark:bg-slate-600 dark:text-slate-50',
        success: 
          'success group border-0 bg-emerald-500 text-slate-50',
        info: 
          'info group border-0 bg-blue-500 text-slate-50',
        error:
          'error group border-red-500 bg-red-500 text-slate-50 dark:border-red-900 dark:bg-red-900 dark:text-slate-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export { Variants };
