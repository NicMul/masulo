/***
*
*   A/B TESTING VIEW
*   A/B testing management view for promotions and content
*
**********/

import { useState, useContext } from 'react';
import { ViewContext, Animate, Card, Button } from 'components/lib';

export function ABTesting({ t }) {
  // context
  const viewContext = useContext(ViewContext);

  // state
  const [isLoading, setIsLoading] = useState(false);

  // handle create A/B test
  const handleCreateABTest = () => {
    viewContext.notification({
      description: t('ab_testing.create.success'),
      variant: 'success'
    });
  };

  return (
    <Animate type='pop'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
              {t('ab_testing.title')}
            </h1>
            <p className='text-slate-600 dark:text-slate-400 mt-1'>
              {t('ab_testing.description')}
            </p>
          </div>
          <Button
            icon='plus'
            text={t('ab_testing.create_test')}
            onClick={handleCreateABTest}
            disabled={isLoading}
          />
        </div>

        {/* A/B Testing Overview */}
        <Card>
          <div className='text-center py-8'>
            <div className='text-slate-500 dark:text-slate-400 mb-4'>
              <svg className='w-16 h-16 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='1' d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
              </svg>
            </div>
            <h3 className='text-lg font-medium text-slate-900 dark:text-slate-100 mb-2'>
              {t('ab_testing.no_tests')}
            </h3>
            <p className='text-slate-600 dark:text-slate-400 mb-6'>
              {t('ab_testing.no_tests_description')}
            </p>
            <Button
              icon='plus'
              text={t('ab_testing.create_first_test')}
              onClick={handleCreateABTest}
              variant='outline'
            />
          </div>
        </Card>

        {/* Quick Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>0</div>
              <div className='text-sm text-slate-600 dark:text-slate-400'>{t('ab_testing.active_tests')}</div>
            </div>
          </Card>
          <Card>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600 dark:text-green-400'>0</div>
              <div className='text-sm text-slate-600 dark:text-slate-400'>{t('ab_testing.completed_tests')}</div>
            </div>
          </Card>
          <Card>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>0</div>
              <div className='text-sm text-slate-600 dark:text-slate-400'>{t('ab_testing.total_tests')}</div>
            </div>
          </Card>
        </div>
      </div>
    </Animate>
  );
}
