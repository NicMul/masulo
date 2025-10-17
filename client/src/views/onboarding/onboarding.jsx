/***
*
*   ONBOARDING
*   Example user onboarding flow.
*
**********/

import { Fragment, useContext } from 'react';
import { AuthContext, Onboarding, Form, Alert } from 'components/lib';

export function OnboardingView({ t }){

  const authContext = useContext(AuthContext);

  const views = [{

    name: t('onboarding.welcome.title'),
    description: `${t('onboarding.welcome.description')}, ${authContext.user.name}!`,
    component: <Welcome t={ t }/>,

  }]

  if (authContext.permission.admin){
    views.push({

      name: t('onboarding.invite_team.title'),
      description: t('onboarding.invite_team.description'),
      component: <InviteUsers t={ t }/>,
      
    });
  }

  if (authContext.user.duplicate_user){
    views.unshift({

      name: t('onboarding.duplicate_user.title'),
      description: '',
      component: <DuplicateUser t={ t }/>,

    })
  }

  return <Onboarding save onFinish='/dashboard' views={ views }/>

}

function DuplicateUser({ t }){

  return (
    <Alert
      variant='warning'
      title={ t('onboarding.duplicate_user.message.title') }
      description={ t('onboarding.duplicate_user.message.description') }
    />    
  )
}

function Welcome({ t }){

  return (
    <Fragment>

      <p>{ t('onboarding.welcome.text.0') }</p>
      <p><strong>{ t('onboarding.welcome.text.1') }</strong></p>

    </Fragment>
  )
}

function InviteUsers({ t }){

  return (
    <Form 
      inputs={{
        email: {
          label: t('onboarding.invite_team.form.email.label'),
          type: 'email',
          required: true,
        }
      }}
      buttonText={ t('onboarding.invite_team.form.button') }
      url='/api/invite' 
      method='POST'
    />
  )
}