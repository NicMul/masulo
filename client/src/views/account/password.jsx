/***
*
*   PASSWORD
*   Update the users password.
*
*   If the user has a password show old and new inputs.
*   If no existing password (eg. in case of social signin)
*   then allow the user to set a password on their account
*
**********/

import { useContext } from 'react';
import { AuthContext, ViewContext, Animate, Row, Card, Form } from 'components/lib';

export function Password({ t }){

  const authContext = useContext(AuthContext);
  const viewContext = useContext(ViewContext);
  
  return (
    <Animate>
      <Row width='lg'>
        <Card title={ t('account.password.subtitle') }>

          <Form
            url='/api/user/password'
            method='PUT'
            buttonText={ t('account.password.form.button') }
            inputs={{
              ...authContext.user.has_password && { 
                oldpassword: {
                  label: t('account.password.form.old_password.label'),
                  type: 'password',
                  required: true
                },
                has_password: {
                  type: 'hidden',
                  value: true,
                }
              },
              newpassword: {
                label: t('account.password.form.new_password.label'),
                type: 'password',
                required: true,
                validation: { complex: true }
              },
            }}
            callback={ () => {
              
              setDone(true);
              authContext.update({ has_password: true });
              viewContext.notification({

                title: t('account.password.success_message.title'),
                description: t('account.password.success_message.text')

              });
            }}
          /> 
        </Card>
      </Row>
    </Animate>
  );
}
