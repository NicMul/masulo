/***
*
*   404
*   Generic 404 error page
*
**********/

import { Row, Button } from 'components/lib';

export function NotFound({ t }){

  return(
    <div>

      <Row>
        <section>
          <h1>{ t('error.404.title') }</h1>
          <p>{ t('error.404.description') }</p>
        </section>
      </Row>
    
      <Button 
        text={ t('error.404.button') } 
        url='/dashboard' 
        size='full'
        color='green'
      />

    </div>
  );
}
