/***
*
*   CARD
*   Displays a card with header, content, and footer.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/card
*   https://ui.shadcn.com/docs/components/card
*
*   PROPS
*   center: align the card in the center of its parent (boolean, optional)
*   children: children to render (component(s), required)
*   className: custom class (SCSS or tailwind style, optional)
*   description: header description (string, optional)
*   headerAction: React component to display on the right side of the header (component, optional)
*   loading: toggle the loading animation (boolean, optional)
*   title: header title (string, optional)
*
**********/

import { Fragment, forwardRef, Children, isValidElement } from 'react';
import { cn, Loader } from 'components/lib';

const Card = forwardRef(({ className, title, loading, description, center, headerAction, children, ...props }, ref) => {

  let footer = null;
  
  const childrenToRender = Children.map(children, child => {

    if (isValidElement(child) && child.type.name === 'CardFooter'){

      // remove footer from the normal children
      footer = child;
      return null;

    }

    return child;
    
  });

  const style = cn({
    'relative rounded-lg border border-slate-100 bg-white text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50': true,
    'mx-auto': center,
    'h-72 [&>div]:mt-4': loading,
  }, className);
  
  return (
    <div ref={ ref } className={ style } {...props}>

      { loading ?
        <Loader/> :
        <Fragment>

          { (title || description || headerAction) &&
            <CardHeader>

              <div className="flex flex-col">
                { title && 
                  <CardTitle>{ title }</CardTitle> 
                }

                { description &&
                  <CardDescription>{ description }</CardDescription> 
                }
              </div>

              { headerAction &&
                <div className="flex items-center">
                  { headerAction }
                </div>
              }

            </CardHeader> 
          }

          { childrenToRender && 
            <CardContent>
              { children }
            </CardContent> 
          }

          { footer }

      </Fragment> }
    </div>
  )
});

Card.displayName = 'Card'

const CardHeader = forwardRef(({ className, ...props }, ref) => (

  <div 
    ref={ ref } 
    className={cn('flex items-center justify-between m-6 mb-0 pb-5 border-solid border-slate-100 border-b dark:border-slate-800', className)} 
    {...props} 
  />

))

CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef(({ className, ...props }, ref) => (

  <h3 ref={ ref } className={ cn('block text-xl font-semibold leading-none tracking-tight', className)} {...props } />

))

CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef(({ className, ...props }, ref) => (

  <p ref={ ref } className={ cn('block text-slate-500 dark:text-slate-400 mt-2', className)} {...props } />

))

CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef(({ className, ...props }, ref) => (

  <div ref={ ref } className={cn('p-6 [&>h1]:mt-4 [&>h1]:font-semibold [&>h1]:text-md [&>span]:block [&>span]:mb-2', className)} {...props } />

))

CardContent.displayName = 'CardContent'

const CardFooter = forwardRef(({ className, ...props }, ref) => (

  <div ref={ ref } className={cn('flex items-center p-6 pt-0', className)} {...props } />

))

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
