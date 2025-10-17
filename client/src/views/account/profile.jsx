/***
*
*   PROFILE
*   Update the user profile or close the account.
*
**********/

import { useContext } from 'react';
import { AuthContext, ViewContext, Form, Card, Row,
  Button, useNavigate, Animate, Event, useAPI } from 'components/lib';

export function Profile({ t }){

  const navigate = useNavigate();
  
  // context
  const authContext = useContext(AuthContext);
  const viewContext = useContext(ViewContext);

  // fetch
  const user = useAPI('/api/user');

  function closeAccount(){
    viewContext.dialog.open({

      title: t('account.profile.close_account.title'),
      description: t('account.profile.close_account.description'),
      form: {
        inputs: {
          password: {
            label: t('account.profile.close_account.form.password.label'),
            description: t('account.profile.close_account.form.password.description'),
            type: 'password',
            required: true,
          }
        },
        method: 'DELETE',
        destructive: true,
        url: authContext.permission.owner ? '/api/account' : '/api/user',
        buttonText: t('account.profile.close_account.button'),
      },
    }, () => {

      // destory user
      Event({ name: 'closed_account' });
      localStorage.clear();
      window.location.reload();
      return window.location.replace('/signin');
      
    });
  }

  return (
    <Animate>

      <Row width='lg'>
        <Card title={ t('account.profile.subtitle') } loading={ user.loading }>

          { user?.data &&
            <Form
              buttonText={ t('account.profile.form.button') }
              url='/api/user'
              method='PATCH'
              inputs={{
                name: {
                  label: t('account.profile.form.name.label'),
                  type: 'text',
                  required: true,
                  value: user.data.name,
                  errorMessage: t('account.profile.form.name.error'),
                },
                email: {
                  label: t('account.profile.form.email.label'),
                  type: 'email',
                  required: true,
                  value: user.data.email,
                  errorMessage:  t('account.profile.form.email.error'),
                },
                avatar: {
                  label: t('account.profile.form.avatar.label'),
                  type: 'file', 
                  accept: ['image/png', 'image/jpeg', 'image/jpg'],
                  required: false, 
                  max: 1,
                },
                ...user.data.permission === 'owner' && {
                  account_name: {
                    type: 'text',
                    label: t('account.profile.form.account_name.label'),
                    value: user.data.account_name
                  }
                },
                ...user.data.accounts?.length > 1 && {
                  default_account: {
                    label: t('account.profile.form.default_account.label'),
                    type: 'select',
                    defaultValue: user.data.default_account,
                    options: user.data.accounts.map(x => { return {

                      value: x.id, label: x.name

                    }})
                  }
                }
              }}
              callback={ res => {

                const data = res.data.data;

                // update the account name
                if (data.account_name && authContext.user?.accounts?.length > 0){

                  const accounts = [...authContext.user.accounts]
                  accounts[accounts.findIndex(x => x.id === authContext.user.account_id)].name = data.account_name;
                  authContext.update({ accounts: accounts })

                }

                // update the user name
                if (data.name)
                  authContext.update({ name: data.name });

                // update the avatar
                if (data.avatar)
                  authContext.update({ avatar: data.avatar });
                
                // user changed email and needs to verify
                if (data.hasOwnProperty('verified') && !data.verified){

                  authContext.update({ verified: false });
                  navigate('/signup/verify')

                }
              }}
            />
          }

        </Card>
      </Row>

      <Row width='lg'>
        <Card title='Danger Zone'>

          <Button
            variant='destructive'
            action={ closeAccount }
            text={ t('account.profile.close_account.title') }
          />

        </Card>
      </Row>

    </Animate>
  );
}
