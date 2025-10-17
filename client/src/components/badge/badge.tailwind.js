import { cva } from 'components/lib';

const Variants = cva(
  
  `inline-flex items-center rounded-full border px-2.5 py-0.5 
   text-xs font-semibold transition-colors focus:outline-none 
   focus:ring-2 focus:ring-ring focus:ring-offset-2`,

  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 
          'text-foreground',
        red: 
          'border-transparent bg-red-500 text-destructive-foreground hover:bg-red-500/80',
        blue: 
          'border-transparent bg-blue-500 text-destructive-foreground hover:bg-blue-500/80',
        green: 
          'border-transparent bg-emerald-500 text-destructive-foreground hover:bg-emerald-500/80',
        orange: 
          'border-transparent bg-orange-500 text-destructive-foreground hover:bg-orange-500/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export default Variants