/***
*
*   ACCOUNT LAYOUT
*   Two column layout with side sub nav.
* 
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/layout
*
*   PROPS
*   children: will be passed from router > view > here (component(s), required)
*   title: title of the view for the header (string, required)
*
**********/

import { Fragment, useContext } from 'react';
import { AuthContext, VerticalNav, DrawerNav, SubNav, Header, User, useTranslation } from 'components/lib';

export function AccountLayout({ title, children }){

  // context & style
  const { t } = useTranslation();
  const authContext = useContext(AuthContext);

  const nav = [
    { label: t('nav.dashboard'), icon: 'gauge', link: '/dashboard', position: 'top' },
    { label: t('nav.account'), icon: 'user', link: '/account', position: 'top' },
    { label: t('nav.help'), icon: 'help-circle', link: '/help', position: 'bottom' },
    { label: t('nav.signout'), icon: 'log-out', action: authContext.signout, position: 'bottom' }
  ]

  const subnav = [
    { label: t('account.nav.profile'), link: '/account/profile', icon: 'user', permission: 'user' },
    { label: t('account.nav.password'), link: '/account/password', icon: 'lock', permission: 'user' },
    { label: t('account.nav.2fa'), link: '/account/2fa', icon: 'shield-check', permission: 'user' },
    { label: t('account.nav.billing'), link: '/account/billing', icon: 'credit-card', permission: 'owner' },
    { label: t('account.nav.notifications'), link: '/account/notifications', icon: 'bell', permission: 'user' },
    { label: t('account.nav.api_keys'), link: '/account/apikeys', icon: 'key', permission: 'developer' },
    { label: t('account.nav.users'), link: '/account/users', icon: 'users', permission: 'admin' }
  ]

  return (
    <Fragment>

      <VerticalNav items={ nav }/>
      <DrawerNav items={ nav }/>
    
      <main className='p-4 pt-20 min-h-screen sm:pl-20 sm:pr-6 sm:pt-0 dark:bg-slate-900'>

        <Header title={ t(title) }>
          <User/>
        </Header>

        <SubNav items={ subnav }/>

        <section className='flex lg:ml-36'>
          { children }
        </section>

      </main>
    </Fragment>
  );
}