import { Dashboard } from 'views/dashboard/dashboard';
import { Games } from 'views/dashboard/games';
import { Promotions } from 'views/dashboard/promotions';
import { ABTesting } from 'views/dashboard/ab-testing';
import { Edit } from 'views/dashboard/edit';
import { Scrape } from 'views/dashboard/scrape';
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
    path: '/ab-testing',
    view: ABTesting,
    layout: 'app',
    permission: 'user',
    title: 'ab_testing.title'
  },
  {
    path: '/edit',
    view: Edit,
    layout: 'app',
    permission: 'user',
    title: 'edit.title'
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
