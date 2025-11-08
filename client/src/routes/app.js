import { Dashboard } from 'views/dashboard/dashboard';
import { Games } from 'views/dashboard/games';
import { Promotions } from 'views/dashboard/promotions';
import { ABTesting } from 'views/experiments/experiments';
import { ABTestCreate } from 'views/experiments/create';
import { ABTestEdit } from 'views/experiments/edit';
import { Edit } from 'views/dashboard/edit';
import { Scrape } from 'views/dashboard/scrape';
import { Configure } from 'views/dashboard/configure';
import { Help } from 'views/dashboard/help';
import { OnboardingView } from 'views/onboarding/onboarding';

const Routes = [
  {
    path: '/dashboard',
    view: Dashboard,
    layout: 'app',
    permission: 'user',
    title: 'dashboard.title'
  },
  {
    path: '/games',
    view: Games,
    layout: 'app',
    permission: 'user',
    title: 'games.title'
  },
  {
    path: '/scrape',
    view: Scrape,
    layout: 'app',
    permission: 'user',
    title: 'scrape.title'
  },
  {
    path: '/promotions',
    view: Promotions,
    layout: 'app',
    permission: 'user',
    title: 'promotions.title'
  },
  {
    path: '/experiments/:id',
    view: ABTestEdit,
    layout: 'app',
    permission: 'user',
    title: 'ab_testing.edit.title'
  },
  {
    path: '/experiments',
    view: ABTesting,
    layout: 'app',
    permission: 'user',
    title: 'ab_testing.title'
  },
  {
    path: '/experiments/create',
    view: ABTestCreate,
    layout: 'app',
    permission: 'user',
    title: 'ab_testing.create.title'
  },
  
  {
    path: '/edit/:gameId',
    view: Edit,
    layout: 'app',
    permission: 'user',
    title: 'edit.title'
  },
  {
    path: '/edit',
    view: Edit,
    layout: 'app',
    permission: 'user',
    title: 'edit.title'
  },
  {
    path: '/configure',
    view: Configure,
    layout: 'app',
    permission: 'user',
    title: 'configure.title'
  },
  {
    path: '/welcome',
    view: OnboardingView,
    layout: 'onboarding',
    permission: 'user',
    title: 'onboarding.title'
  },
  {
    path: '/help',
    view: Help,
    layout: 'app',
    permission: 'user',
    title: 'help.title'
  }
]

export default Routes;
