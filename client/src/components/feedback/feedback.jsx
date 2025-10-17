/***
*
*   FEEDBACK
*   Widget for collecting user feedback.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/feedback
*
**********/

import { useState, useContext, useCallback } from 'react';
import { ViewContext, Form, Button, Icon, Popover, PopoverTrigger, PopoverContent } from 'components/lib';

export function Feedback(){

  // context & state
  const context = useContext(ViewContext);
  const [showComments, setShowComments] = useState(false);
  const [rating, setRating] = useState(null);
  const [open, setOpen] = useState(false);

  const icons = [
    { name: 'smile', color: 'green' }, 
    { name: 'meh', color: 'orange' },
    { name: 'frown', color: 'red' }
  ]

  const ratings = ['positive', 'neutral', 'negative'];

  const saveRating = useCallback((rating) => {

    setRating(rating);
    setShowComments(true);

  }, []);

  return (
    <Popover className='fixed right-2 bottom-2 left-2 md:left-auto w-96 drop-shadow-md z-50' open={ open }>

      <PopoverTrigger onClick={ () => setOpen(!open) } asChild>
        <div className='flex fixed right-4 bottom-4 w-10 h-10 rounded-full bg-pink-400 hover:bg-pink-500 items-center justify-center shadow-md'>
          <Icon name='heart' color='white' size={ 20 }/> 
        </div>
      </PopoverTrigger>

      <PopoverContent className='mr-4' align='right' sideOffset='1' onInteractOutside={ () => setOpen(false) }>

        <h2 className='block text-xl font-semibold leading-none text-center mt-2 mb-4'>
          { context.t('global.feedback.title') }
        </h2>

        <div className='flex gap-x-4 justify-center'>
          { icons.map((icon, index) => {

            const isSelected = rating === index;

            return (
              <Button 
                key={ icon.name } 
                icon={ icon.name } 
                size='lg'
                iconSize='36'
                iconColor={ isSelected ? icon.color : rating !== null ? 'dark' : icon.color }
                action={ () => saveRating(index) }
                className='!w-22 !h-22 rounded'
              />
            );
          })}
        </div> 

        { showComments && 
          <Form 
            inputs={{
              rating: {
              type: 'hidden',
              value: ratings[rating]
            },
              comment: {
              label: context.t('global.feedback.form.comment.label'),
              type: 'textarea',
            }
            }}
            method='POST'
            url='/api/feedback'
            className='mt-4'
            buttonText={ context.t('global.feedback.form.button') }
            callback={ e => {

              setTimeout(() => setOpen(false), 3000);

            }}
          /> 
        }

      </PopoverContent>
    </Popover>
  );
}