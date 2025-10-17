/***
*
*   SETUP WELCOME SCREEN
*   You can delete this when you've completed the setup process.
*
**********/

import { Fragment } from 'react';

export function SetupWelcome(){

  return (
    <Fragment>

      <p>Welcome to Gravity! These next few steps will help you set up your application.</p>
      <p>If you'd prefer to do this manually, you can edit the files in the /config directory.</p>
      <p>If you need help, <a href='https://docs.usegravity.app'>please refer to the docs</a> or <a href='mailto:support@usegravity.app'>contact support.</a></p>

      <p><strong>Happy Building!</strong></p>

    </Fragment>
  )
}