/***
*
*   SETUP DATABASE
*   Configures your Stripe settings for processing payments.
*   You can delete this when you've completed the setup process.
*
**********/

import { Fragment } from 'react';
import { Form, Loader, Row, Alert, useAPI } from 'components/lib';

export function SetupStripe(){

  const settings = useAPI('/api/setup/stripe');
 
  if (settings.loading)
    return <Loader />
  
  return(
    <Fragment>

      <Row>
        <Alert 
          variant='info'
          description='Need help? Refer to the Stripe setup guide' 
          button={{
            
            text: 'Open Stripe Setup Guide',
            url: 'https://docs.mesulo.com/mesulo-server/installation/stripe-setup'

          }}
        />
      </Row>

      <Form
        inputs={{
          test_pk: {
            label: 'Test Publishable API Key',
            type: 'text',
            required: true,
            placeholder: 'pk_test',
            value: settings?.data?.publishableAPIKey,
            errorMessage: 'Please enter your test publishable API key'
          },
          test_sk: {
            label: 'Test Secret API Key',
            type: 'text',
            required: true,
            placeholder: 'sk_test',
            value: settings?.data?.secretAPIKey,
            errorMessage: 'Please enter your test secret API key'
          },
          live_pk: {
            label: 'Live Publishable API Key',
            type: 'text',
            placeholder: 'pk_live',
            errorMessage: 'Please enter your publishable API key'
          },
          live_sk: {
            label: 'Live Secret API Key',
            type: 'text',
            placeholder: 'sk_live',
            errorMessage: 'Please enter your secret API key'
          },
          freePlan: {
            label: 'Include a free plan',
            type: 'switch',
            defaultValue: true,
          },
          webhook_secret: {
            label: 'Stripe webhook secret',
            type: 'text', 
            required: false
          }
        }}
        url='/api/setup/stripe'
        method='POST'
        buttonText='Save'
      />
    </Fragment>
  );
}
