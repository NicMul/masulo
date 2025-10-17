import { Account } from 'views/account';
import { Profile } from 'views/account/profile';
import { Billing } from 'views/account/billing';
import { Upgrade } from 'views/account/upgrade';
import { Users } from 'views/account/users';
import { Password } from 'views/account/password';
import { TwoFA } from 'views/account/2fa';
import { Notifications } from 'views/account/notifications';
import { APIKeyList } from 'views/account/apikey/list';
import { APIKeyEditor } from 'views/account/apikey/edit';

const Routes = [
  {
    path: '/account',
    view: Account,
    layout: 'app',
    permission: 'user',
    title: 'account.index.title'
  },
  {
    path: '/account/profile',
    view: Profile,
    layout: 'account',
    permission: 'user',
    title: 'account.index.title'
  },
  {
    path: '/account/password',
    view: Password,
    layout: 'account',
    permission: 'user',
    title: 'account.index.title'
  },
  {
    path: '/account/2fa',
    view: TwoFA,
    layout: 'account',
    permission: 'user',
    title: 'account.index.title'
  },
  {
    path: '/account/billing',
    view: Billing,
    layout: 'account',
    permission: 'owner',
    title: 'account.index.title'
  },
  {
    path: '/account/upgrade',
    view: Upgrade,
    layout: 'account',
    permission: 'owner',
    title: 'account.index.title'
  },
  {
    path: '/account/users',
    view: Users,
    layout: 'account',
    permission: 'admin',
    title: 'account.index.title'
  },
  {
    path: '/account/notifications',
    view: Notifications,
    layout: 'account',
    permission: 'user', 
    title: 'account.index.title'
  },
  {
    path: '/account/apikeys',
    view: APIKeyList,
    layout: 'account',
    permission: 'developer', 
    title: 'account.index.title'
  },
  {
    path: '/account/apikeys/create',
    view: APIKeyEditor,
    layout: 'account',
    permission: 'developer', 
    title: 'account.index.title'
  },
  {
    path: '/account/apikeys/edit',
    view: APIKeyEditor,
    layout: 'account',
    permission: 'developer',
    title: 'account.index.title'
  },
]

export default Routes;