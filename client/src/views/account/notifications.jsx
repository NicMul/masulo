/***
*
*   NOTIFICATIONS
*   User can choose which notifications they receive.
*
**********/

import { useEffect, useState } from 'react';
import { Animate, Card, Row, Form, useAPI } from 'components/lib';

export function Notifications({ t }){
  
  const [inputs, setInputs] = useState(null);
  const res = useAPI('/api/notification');
  
  useEffect(() => {

    // dynamically render the available
    // inputs for this user's permission
    if (res.data?.length){
      
      const s = {};
      res.data.forEach(input => {

        s[input.name] = {
          type: 'switch',
          defaultValue: input.active,
          label: t(`account.notifications.form.options.${input.name}`),
        }

      })

      setInputs(s);

    }
  }, [res.data]);
  

  return (
    <Animate>
      <Row width='lg'>
        <Card title={ t('account.notifications.subtitle') } loading={ res.loading }>

          { inputs &&
            <Form 
              method='patch'
              url='/api/notification'
              inputs={ inputs }
              buttonText={ t('account.notifications.form.button') }
            />
          }

        </Card>
      </Row>
    </Animate>
  );
}
