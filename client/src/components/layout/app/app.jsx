/***
*
*   APP LAYOUT
*   Main app layout containing the navigation and header.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/layout
*
*   PROPS
*   children: will be passed from router > view > here (component(s), required)
*   title: title of the view for the header (string, required)
*
**********/

import { Fragment, useContext } from 'react';
import { AuthContext, VerticalNav, DrawerNav, Header, User, useTranslation } from 'components/lib';

export function AppLayout({ title, children }){

  // context & style
  const { t } = useTranslation();
  const authContext = useContext(AuthContext);

  const nav = [
    { label: t('nav.dashboard'), icon: 'gauge', link: '/dashboard', position: 'top' },
    { label: t('nav.account'), icon: 'user', link: '/account', position: 'top' },
    { label: t('nav.help'), icon: 'help-circle', link: '/help', position: 'bottom' },
    { label: t('nav.signout'), icon: 'log-out', action: authContext.signout, position: 'bottom' }
  ]

  return (
    <Fragment>

      <VerticalNav items={ nav }/>
      <DrawerNav items={ nav }/>

      <main className='p-4 pt-20 min-h-screen sm:pl-20 sm:pr-6 sm:pt-0 dark:bg-slate-900'>

        <Header title={ t(title) }>
          <User />
        </Header>

        { children }

      </main>
    </Fragment>
  );
}