/***
*
*   ACCOUNT
*   Index page for account functions
*
**********/

import { useContext } from 'react';
import { AuthContext, Animate, Grid, Card, Button, Icon, Loader, useAPI } from 'components/lib';

export function Account({ t }){

  const context = useContext(AuthContext);

  const user = useAPI('/api/user');
  const iconSize = 20;

  if (user.loading)
    return <Loader />

  return (
    <Animate>
      <Grid max={ 8 }>  

        <Card variant='mini'>

          <Icon name='user' size={ iconSize }/> 

          <h1>{ t('account.profile.title') }</h1>
          <span>{ t('account.profile.description') }</span>

          <Button 
            size='xs' 
            variant='outline'
            url='/account/profile' 
            text={ t('account.profile.button') } 
          />

        </Card>

        <Card>

          <Icon name='lock' size={ iconSize }/>

          <h1>{ t('account.password.title') }</h1>
          <span>{ user?.data?.['has_password'] ? t('account.password.description.change') : t('account.password.description.create') }</span>
          
          <Button 
            size='xs' 
            variant='outline'
            url='/account/password'
            text={ user?.data?.['has_password'] ? t('account.password.button.change') : t('account.password.button.create') }
          />

        </Card>

        <Card>

          <Icon name='fingerprint' size={ iconSize }/>

          <h1>{ t('account.2fa.title') }</h1>
          <span>{ t('account.2fa.description') }</span>

          <Button
            size='xs'
            variant='outline'
            url='/account/2fa'
            text={ user?.data?.['2fa_enabled'] ? t('account.2fa.button.manage') : t('account.2fa.button.enable') }
          />

        </Card>

        { context.permission?.owner &&
          <Card>

            <Icon name='credit-card' size={ iconSize }/>

            <h1>{ t('account.billing.title') }</h1>
            <span>{ t('account.billing.description') }</span>

            <Button
              size='xs'
              variant='outline'
              url='/account/billing'
              text={ t('account.billing.button') }
            />

          </Card>
        }

        <Card>

          <Icon name='bell' size={ iconSize }/>

          <h1>{ t('account.notifications.title') }</h1>
          <span>{ t('account.notifications.description') }</span>

          <Button
            size='xs'
            variant='outline'
            url='/account/notifications'
            text={ t('account.notifications.button') }
          />

        </Card>

        { context.permission?.developer &&
          <Card>

            <Icon name='key-round' size={ iconSize }/>

            <h1>{ t('account.api_keys.title') }</h1>
            <span>{ t('account.api_keys.description') }</span>

            <Button
              size='xs'
              variant='outline'
              url='/account/apikeys'
              text={ t('account.api_keys.button') }
            />

          </Card>
        }

        { context.permission?.admin &&
          <Card>

            <Icon name='users' size={ iconSize }/>

            <h1>{ t('account.users.title') }</h1>
            <span>{ t('account.users.description') }</span>

            <Button
              size='xs'
              variant='outline'
              url='/account/users'
              text={ t('account.users.button') }
            />

          </Card>
        }

      </Grid>
    </Animate>
  )
}