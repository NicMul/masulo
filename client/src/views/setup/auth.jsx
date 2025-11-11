/***
*
*   SETUP AUTHENTICATION
*   Configure networks for social sign in.
*
**********/

import { Fragment } from 'react';
import { Form, Row, Alert } from 'components/lib';

export function SetupAuth(){

  return(
    <Fragment>

      <Row>
        <Alert 
          variant='info'
          description='Need help? Refer to the setup guide' 
          button={{

            text: 'Open Setup Guide',
            url: 'https://docs.mesulo.com/mesulo-server/authentication/social-sign-on'

          }}
        />
       </Row>

      <Form
        inputs={{
          facebook_app_id: {
            type: 'password',
            label: 'Facebook App ID',
          },
          facebook_app_secret: {
            type: 'password',
            label: 'Facebook App Secret',
          },
          twitter_api_key: {
            type: 'password',
            label: 'Twitter App ID',
          },
          twitter_api_secret: {
            type: 'password',
            label: 'Twitter API Secret',
          }
        }}
        url='/api/setup/auth'
        method='POST'
        buttonText='Save'
      />
    </Fragment>
  );
}
