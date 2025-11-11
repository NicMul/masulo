/***
*
*   SETUP MAILGUN
*   Connects your Mailgun account for sending email notifications.
*
**********/

import { Fragment } from 'react';
import { Form, Row, Alert, Loader, useAPI } from 'components/lib';

export function SetupMailgun(){

  const settings = useAPI('/api/setup/mailgun');

  if (settings.loading)
   return <Loader />

  return(

    <Fragment>

      <Row>
        <Alert 
          variant='info'
          description='Need help? Refer to the Mailgun setup guide' 
          button={{

            text: 'Open Mailgun Docs',
            url: 'https://docs.mesulo.com/mesulo-server/installation/mailgun-setup'

          }}
        />
      </Row>

      <Form
        inputs={{
          apiKey: {
            label: 'API Key',
            type: 'text',
            required: true,
            value: settings?.data?.apiKey,
            errorMessage: 'Please enter your Mailgun API Key'
          },
          domain: {
            label: 'Mail Domain',
            type: 'url',
            required: true,
            placeholder: 'mail.domain.com',
            value: settings?.data?.domain,
            errorMessage: 'Please enter your mailing domain'
          },
          host: {
            label: 'Host (Region)',
            type: 'select',
            defaultValue: 'api.mailgun.net',
            options: [
              { value: 'api.mailgun.net', label: 'US' },
              { value: 'api.eu.mailgun.net', label: 'EU' },
            ]
          },
          sender: {
            label: 'Sender Address',
            type: 'text',
            required: true,
            value: settings?.data?.sender,
            placeholder: 'Sender Name <name@domain.com>',
            errorMessage: 'Please enter your sender address'
          },
        }}
        url='/api/setup/mailgun'
        method='POST'
        buttonText='Save'
      />
    </Fragment>
  );
}
