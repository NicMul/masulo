/***
*
*   USERS
*   Enables an admin to manage the users in their application
*
**********/

import { useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Avatar, ViewContext, AuthContext, Card, Event, Table, Animate, 
  usePermissions, useAPI } from 'components/lib';

export function Users({ t }){

  // context
  const viewContext = useContext(ViewContext);
  const authContext = useContext(AuthContext);

  // fetch
  const permissions = usePermissions();
  const fetchUsers = useAPI('/api/account/users');

  // state
  const [users, setUsers] = useState([]);

  // format users and invites on initial load
  useEffect(() => {

    if (fetchUsers.data?.users){

      const formatted = formatUsers({ 
        
        users: fetchUsers.data.users, 
        invites: fetchUsers.data.invites 
      
      });

      setUsers([
        ...(formatted.users?.length ? formatted.users : []),
        ...(formatted.invites?.length ? formatted.invites : []),
      ]);
    }
  }, [fetchUsers]);

  // format the users and invites
  const formatUsers = useCallback(({ users, invites }) => {

    let formattedUsers, formattedInvites;

    if (users?.length){
      formattedUsers = users.map(user => {

        const { avatar, verified, ...rest } = user;

        return {
          avatar: user.avatar ? <Avatar src={ user.avatar } /> : null,
          ...rest,
          status: verified ? 
            t('account.users.status.verified') : 
            t('account.users.status.registered')
        }
      })
    }

    if (invites?.length){
      formattedInvites = invites.map(invite => {

        return {
          id: invite.id,
          avatar: <Avatar fallback={ invite.email.charAt(0) } />,
          name: '',
          email: invite.email,
          date_created: invite.date_sent,
          permission: invite.permission || 'user',
          status: t('account.users.status.invited'),
          actions: [
            { icon: 'mail', label: t('global.table.action.resend_invite'), action: resendInvite },
            { icon: 'trash', label: t('global.table.action.delete'), action: deleteInvite },
          ]
        }
      })
    }

    return { users: formattedUsers, invites: formattedInvites }

  }, [t]);

  const inviteUser = useCallback(() => {

    viewContext.dialog.open({
      title: t('account.users.invite.title'),
      description: t('account.users.invite.description'),
      form: {
        inputs: {
          email: {
            label: t('account.users.invite.form.email.label'),
            type: 'text',
            required: true,
          },
          permission: {
            label: t('account.users.invite.form.permission.label'),
            type: 'select',
            defaultValue: 'user',
            options: permissions?.data?.list?.filter(x => x.value !== 'owner') 
          },
        },
        buttonText: t('account.users.invite.form.button'),
        url: '/api/invite',
        method: 'POST'
      }
    }, (form, res) => {

      const invites = res.data.data;

      // add the invited user to the
      if (invites.length){

        const format = formatUsers({ invites });
        setUsers([ ...users, ...format.invites ]);
        Event({ name: 'invited_user' });

      }
    });
  }, [permissions.data, t, users, formatUsers, viewContext]);

  const editUser = useCallback(({ row, editRowCallback }) => {

    viewContext.dialog.open({
      title: t('account.users.edit.title'),
      form: {
        inputs: {
          id: {
            type: 'hidden',
            value: row.id
          },
          name: {
            label: t('account.users.edit.form.name.label'),
            type: 'text',
            required: true,
            value: row.name,
            errorMessage: 'Please enter a name'
          },
          email: {
            label: t('account.users.edit.form.email.label'),
            type: 'email',
            value: row.email,
            required: true,
          },
          permission: {
            label: t('account.users.edit.form.permission.label'),
            type: row.permission === 'owner' ? null : 'select',
            options: permissions?.data?.list?.filter(x => x.value !== 'owner') ,
            defaultValue: row.permission
          }
        },
        buttonText: t('account.users.edit.form.button'),
        url: '/api/user',
        method: 'PATCH'
      }
    }, (form) => {

      const newState = editRowCallback(form);
      setUsers(newState);

    });
  }, [permissions.data, t, viewContext]);

  const deleteUser = useCallback(({ row, deleteRowCallback }) => {

    viewContext.dialog.open({
      title: t('account.users.delete.title'),
      description: `${t('account.users.delete.description')} ${row.name}?`,
      form: {
        inputs: false,
        buttonText: t('account.users.delete.form.button'),
        url: `/api/user/${row.id}`,
        method: 'DELETE',
        destructive: true
      },
    }, (form, res) => {

      const newState = deleteRowCallback(row);
      setUsers(newState);

      // signout admin
      if (res.data.data.signout)
        authContext.signout();

    });
  }, [t, viewContext, authContext]);

  const deleteInvite = useCallback(({ row, deleteRowCallback }) => {
    
    viewContext.dialog.open({
      title: t('account.users.delete_invite.title'),
      description: `${t('account.users.delete_invite.description')} ${row.email}?`,
      form: {
        inputs: false,
        method: 'DELETE',
        destructive: true,
        url: `/api/invite/${row.id}`,
        buttonText: t('account.users.delete_invite.form.button'),
      },
    }, () => {

      const newState = deleteRowCallback(row);
      setUsers(newState);

    });
  }, [t, viewContext]);

  const resendInvite = useCallback(async ({ row }) => {
    try {

      await axios({ 
        
        url: '/api/invite',
        method: 'post',
        data: { email: row.email }
      
      });

      viewContext.notification({ description: `${t('account.users.invite.resent_notification')} ${row.email}` });

    }
    catch(err){

      viewContext.handleError(err);

    }
  }, [t, viewContext]);

  const contactUser = useCallback(({ row }) => {

    window.location = `mailto:${row.email}`

  }, []);

  return (
    <Animate>

      <Card title={ t('account.users.subtitle') }>
        <Table
          searchable
          className='restrict-width'
          data={ users }
          loading={ fetchUsers.loading }
          show={['avatar', 'email', 'name', 'last_login', 'permission', 'status']}
          badge={{ col: 'status', color: 'blue', condition: [

            { value: t('account.users.status.verified'), color: 'green' },
            { value: t('account.users.status.registered'), color: 'blue' },
            { value: t('account.users.status.invited'), color: 'orange' }

          ]}}
          actions={[
            
            { icon: 'edit', label: t('global.table.action.edit'), action: editUser }, 
            { icon: 'trash', label: t('global.table.action.delete'), action: deleteUser }, 
            { icon: 'mail', label: t('global.table.action.contact'), action: contactUser },
            { icon: 'circle-plus', label: t('global.table.action.new'), action: inviteUser, global: true, globalOnly: true, color: 'green' }
            
          ]}
        />
      </Card>

    </Animate>
  );
}
