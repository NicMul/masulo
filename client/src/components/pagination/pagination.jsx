
/***
*
*   PAGINATION
*   Pagination with page navigation, next and previous links.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/pagination
*   https://ui.shadcn.com/docs/components/pagination
*
*   PROPS
*   children: child components as per shadcn docs if not using items prop (optional)
*   className: custom styling (SCSS or tailwind style, optional)
*   total: total number of items in list (integer, required)
*   limit: number of items per page (integer, required)
*
**********/

import { useEffect, forwardRef } from 'react'
import { cn, Icon, useSearchParams } from 'components/lib'
import buttonVariants from 'components/button/button.tailwind.js';

const Pagination = ({ className, total, limit, children, ...props }) => {

  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page')) || 1;
  
  // calculate the number of pages
  const numberOfPages = Math.ceil(total / limit);

  // set initial page in search params when using pagination
  useEffect(() => {
  
    if (!searchParams.get('page') && numberOfPages > 1)
      setSearchParams({ page: 1 })

  }, [searchParams, setSearchParams]);

   if (numberOfPages < 2)
    return false;

  // create an array of page numbers
  const pages = Array.from({ length: numberOfPages }, (_, i) => i + 1);

  return (
    <nav role='navigation' aria-label='pagination' className={ cn('mx-auto flex w-full justify-center', className) } {...props }>

      { (total || limit) ?
        <PaginationContent>

          <PaginationItem disabled={ currentPage === 1 }>
            <PaginationPrevious href={ `?page=${currentPage-1}` }/> 
          </PaginationItem>
          
          { pages.map(page => (
            <PaginationItem key={ page } disabled={ false }>
              <PaginationLink href={ `?page=${page}` } isActive={ page === currentPage }>
                { page }
              </PaginationLink> 
            </PaginationItem>

          ))}

          <PaginationItem disabled={ currentPage === numberOfPages }>
            <PaginationNext href={ `?page=${currentPage+1}` }/> 
          </PaginationItem>

        </PaginationContent>
      : children }

    </nav>
  )
}

Pagination.displayName = 'Pagination'

const PaginationContent = forwardRef(({ className, ...props }, ref) => (

  <ul ref={ ref } className={ cn('flex flex-row items-center gap-1', className) } {...props }/>

))

PaginationContent.displayName = 'PaginationContent'

const PaginationItem = forwardRef(({ className, disabled, ...props }, ref) => (

  <li ref={ ref } className={ cn(disabled && 'pointer-events-none opacity-50', className)} {...props } />

))

PaginationItem.displayName = 'PaginationItem'

const PaginationLink = ({ className, isActive, size = 'icon', ...props }) => (

  <a
    aria-current={isActive ? 'page' : undefined}
    className={ cn(buttonVariants({ variant: isActive ? 'outline' : 'ghost', size }), className)}
    {...props} 
  />
)

PaginationLink.displayName = 'PaginationLink'

const PaginationPrevious = ({ className, ...props }) => (

  <PaginationLink aria-label='Go to previous page' size='default' className={ cn('gap-1 pl-2.5', className)} {...props }>
    <Icon name='chevron-left' size={ 16 } />
    <span>Previous</span>
  </PaginationLink>

)

PaginationPrevious.displayName = 'PaginationPrevious'

const PaginationNext = ({ className, ...props }) => (

  <PaginationLink aria-label='Go to next page' size='default' className={ cn('gap-1 pl-2.5', className) }{...props }>
  
    <span>Next</span>
    <Icon name='chevron-right' size={ 16 } />

  </PaginationLink>
)

PaginationNext.displayName = 'PaginationNext'

const PaginationEllipsis = ({ className, ...props }) => (

  <span aria-hidden className={ cn('flex h-9 w-9 items-center justify-center', className) } {...props }>
    <Icon name='more-horizontal' size={ 16 }/>
    <span className='sr-only'>More pages</span>
  </span>
)

PaginationEllipsis.displayName = 'PaginationEllipsis'

export { Pagination, PaginationContent, PaginationEllipsis, 
  PaginationItem, PaginationLink,PaginationNext, PaginationPrevious,
}
