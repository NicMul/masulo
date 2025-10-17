/***
*
*   HELP
*   Information for user to get help and support
*
**********/

import { Fragment, memo } from 'react';
import { Card, Form, Row, Alert, Loader, useAPI } from 'components/lib';

export function Help({ t }){

  const user = useAPI('/api/user');

  return (
    <Fragment>

      <Row width='lg'>
        <Alert 
          variant='info'
          title={ t('help.message.title') }
          description={ t('help.message.description') }
          />
      </Row>

      { user.loading ? 
        <Loader /> :
        <Row width='lg'>
          <Card title={ t('help.subtitle') }>      

            <EnableSupport 
              t={ t }
              enabled={ user.data?.support_enabled }
            />
            
            <Row>
              <Form 
                inputs={{
                  email: {
                    type: 'hidden',
                    value: user?.data?.email,
                  },
                  name: {
                    type: 'hidden',
                    value: user?.data?.name
                  },
                  template: { 
                    type: 'hidden', 
                    value: 'help',
                  },
                  message: {
                    type: 'textarea',
                    label: t('help.form.message.label'),
                    errorMessage: t('help.form.message.error'),
                    required: true,
                  }
                }}
                method='POST'
                url='/api/utility/mail'
                buttonText={ t('help.form.button') }
              />
            </Row>
          </Card>
        </Row>
     }
    </Fragment>
  )
}

const EnableSupport = memo(function Enable2FA({ enabled, t, callback }) {

  return (
    <Row>
      <Form 
        inputs={{
          support_enabled: {
            type: 'switch',
            defaultValue: enabled,
            label: t('help.form.support_enabled.label')
          }
        }}
        submitOnChange
        method='PATCH'
        url='/api/user'
      />
    </Row>
  )
});