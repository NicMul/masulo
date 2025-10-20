/***
*
*   SCRAPE VIEW
*   Website scraper view for finding images on websites.
*
**********/

import { useState, useContext } from 'react';
import { ViewContext, Animate, Card, Button, Form, Alert } from 'components/lib';

export function Scrape({ t }) {
  // context
  const viewContext = useContext(ViewContext);

  // state
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedImages, setScrapedImages] = useState([]);

  // handle scrape website
  const handleScrape = async (formData) => {
    setIsLoading(true);
    
    try {
      // TODO: Implement API call when backend is ready
      viewContext.notification({
        description: t('scrape.success'),
        variant: 'success'
      });
    } catch (error) {
      viewContext.notification({
        description: t('scrape.error'),
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animate type='pop'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
              {t('scrape.title')}
            </h1>
            <p className='text-slate-600 dark:text-slate-400 mt-1'>
              {t('scrape.description')}
            </p>
          </div>
        </div>

        {/* Scrape Form */}
        <Card title={t('scrape.form.title')}>
          <Form
            inputs={{
              url: {
                label: t('scrape.form.url.label'),
                type: 'url',
                required: true,
                placeholder: t('scrape.form.url.placeholder')
              }
            }}
            buttonText={t('scrape.form.button')}
            onSubmit={handleScrape}
            loading={isLoading}
          />
        </Card>

        {/* Results */}
        {scrapedImages.length > 0 && (
          <Card title={t('scrape.results.title')}>
            <div className='text-center py-8'>
              <p className='text-slate-600 dark:text-slate-400'>
                {t('scrape.results.empty')}
              </p>
            </div>
          </Card>
        )}

        {/* Info Alert */}
        <Alert
          variant='info'
          title={t('scrape.info.title')}
          description={t('scrape.info.description')}
        />
      </div>
    </Animate>
  );
}
