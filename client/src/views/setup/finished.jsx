/***
*
*   SETUP FINAL SCREEN
*   You can delete this when you've completed the setup process.
*
**********/

import { Fragment } from 'react';
import { Alert } from 'components/lib';

export function SetupFinished(){

  return(
    <Fragment>

      <Alert
        variant='success'
        title='Restart Your Server'
        description='Please restart your node server with npm run dev to ensure all settings take effect and then remove all setup files for security'
      />

    </Fragment>
  );
}