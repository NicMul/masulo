/***
*
*   PAGINATE
*   Pagination control to split results into multiple pages
*   Returns a new offset
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   limit: the number of results per page (integer, required)
*   loading: toggle loading state (boolean, optional)
*   offset: the current position (integer, required)
*   total: the total number of results (integer, required)
*
**********/

import { useState, useEffect } from 'react';
import { Button, ClassHelper } from 'components/lib';
import Style from './paginate.tailwind.js';

export function Paginate(props){
  
  const totalPages = Math.ceil(props.total / props.limit);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {

    if (props.total)
      setTotal(props.total);

  }, [props.total])

  function prev(){
    if (page > 0){

      setPage(page-1)
      props.onChange((page-1) * props.limit)

    }
  }

  function next(){
    if (page < (totalPages-1)){

      setPage(page+1)
      props.onChange((page+1) * props.limit)

    }
  }

  const start = parseInt(props.offset+1); // add one so it doesn't start at 0
  const end = parseInt(props.offset) + parseInt(props.limit);

  const paginateStyle = ClassHelper(Style, { 
    
    paginate: true, 
    className: props.className
  
  });

  return (
    <section className={ paginateStyle }>

      <Button 
        icon='chevron-left' 
        size={ 20 } 
        color='transparent'
        className={ Style.button }
        iconColor={ page > 0 || props.loading ? 'purple' : 'grey' }
        action={ prev }
       />

       <span className={ Style.counter }>

         { (props.offset || props.limit) ? 
          `showing ${start} - ${end > total ? total : end} of ${total} ` : 'No Results' }
          
       </span>
     
       <Button 
        icon='chevron-right' 
        size={ 20 } 
        color='transparent'
        className={ Style.button }
        iconColor={ page < (totalPages-1) || props.loading ? 'purple' : 'grey' }
        action={ next }
       />

   </section>
  )
}