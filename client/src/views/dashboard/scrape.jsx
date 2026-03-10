/***
*
*   SCRAPE VIEW
*   Website scraper view for finding images on websites.
*
**********/

import { useState, useContext, useMemo } from 'react';
import { ViewContext, Animate, Card, Button, Table, Alert, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Input, Switch, Label, Chart, Select, Grid } from 'components/lib';
import { GameCreateForm } from 'components/games/GameCreateForm';
import axios from 'axios';

export function Scrape({ t }) {
  // context
  const viewContext = useContext(ViewContext);

  // state
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedImages, setScrapedImages] = useState([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // config form state
  const [savedConfig, setSavedConfig] = useState({
    autoRunTime: '',
    autoGenerateAnimation: false,
    basePrompt: '',
    autoSave: false
  });
  const [config, setConfig] = useState(savedConfig);

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);

  // chart state
  const [timeRange, setTimeRange] = useState('7d');

  // mock chart data
  const scrapeChartData = useMemo(() => {
    
    // Using generic data shapes that change based on filter just to mock functionality
    const points = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 12;
    const labels = Array.from({length: points}, (_, i) => `${i + 1}`);

    const generateData = (base, variance) => Array.from({length: points}, () => Math.floor(Math.random() * variance) + base);

    return {
      labels,
      datasets: [
        {
          label: 'Total Games Found',
          data: generateData(10, 50)
        },
        {
          label: 'Total Assets Generated',
          data: generateData(5, 30)
        },
        {
          label: 'Total Assets Saved',
          data: generateData(0, 20)
        }
      ]
    };
  }, [timeRange]);

  const handleScrape = async () => {
    setIsLoading(true);
    setScrapedImages([]); // reset

    try {
      const response = await axios.post('/api/scraper', { action: 'start' });

      if (response.data && response.data.success) {
        setScrapedImages(response.data.games || []);
        viewContext.notification({
          description: t('scrape.success', { count: response.data.games?.length || 0 }),
          variant: 'success'
        });
      }
    } catch (error) {
      console.error(error);
      viewContext.notification({
        description: error.response?.data?.message || t('scrape.error'),
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigure = () => {
    setConfig(savedConfig);
    setIsConfigOpen(true);
  };

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked !== undefined ? checked : value) : value
    }));
  };

  const handleSwitchChange = (update) => {
    setConfig(prev => ({ ...prev, [update.target.name]: update.target.value }));
  };

  const clearConfig = () => {
    setConfig({
      autoRunTime: '',
      autoGenerateAnimation: false,
      basePrompt: '',
      autoSave: false
    });
  };

  const saveConfig = () => {
    console.log('Scrape Configuration Saved:', config);
    setSavedConfig(config);
    setIsConfigOpen(false);
  };

  const actions = [
    {
      label: 'Create Game',
      icon: 'settings',
      globalOnly: false,
      action: ({ row }) => {
        const originalGame = scrapedImages.find(g => g.id === row.id) || row;
        viewContext.dialog.open({
          title: t('games.create.title', 'Create Game'),
          className: 'max-w-4xl w-full',
          children: (
            <GameCreateForm
              initialData={originalGame}
              onSuccess={(newGame) => {
                setScrapedImages(prev => prev.filter(g => g.id !== newGame.cmsId));
                viewContext.notification({
                  description: t('games.game_created', 'Game created and saved successfully!'),
                  variant: 'success'
                });
                viewContext.dialog.close();
              }}
              onCancel={() => viewContext.dialog.close()}
              t={t}
            />
          )
        });
      }
    }
  ];

  return (
    <Animate type='pop'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
              {t('scrape.main-title')}
            </h1>
          </div>
          <div className='flex gap-2'>
            <Button
              color='primary'

              size='lg'
              loading={isLoading}
              onClick={handleConfigure}
            >
              {t('scrape.form.configure-button')}
            </Button>
            <Button
              color='green'

              size='lg'
              loading={isLoading}
              onClick={handleScrape}
            >
              {t('scrape.form.execute-button')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scrape Form */}
          <Card title={t('scrape.form.results-title')}>

            {scrapedImages.length > 0 ? (

              <Table
                headers={['Thumbnail', 'Game ID', 'Name']}
                show={['Thumbnail', 'Game ID', 'Name']}
                searchable
                data={scrapedImages.map(game => ({
                  id: game.id,
                  Thumbnail: (
                    <div className="w-16 h-20 rounded overflow-hidden">
                      {game.thumbnail ? (
                        <img src={game.thumbnail} alt={game.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <span className="text-xs text-slate-500">No Image</span>
                        </div>
                      )}
                    </div>
                  ),
                  'Game ID': game.id,
                  Name: game.name || 'Unknown'
                }))}
                actions={actions}
              />

            ) : (
              <div className='flex flex-col items-center justify-center p-8 space-y-4'>
                <p>
                  Your results will appear here once you scrape your website.
                </p>
              </div>

            )}
          </Card>

          {/* Scrape Analytics */}
          <Card 
            title="Scrape Analytics"
            headerAction={
              <Select 
                name="timeRange"
                value={timeRange}
                onValueChange={setTimeRange}
                options={[
                  { value: '24h', label: 'Daily' },
                  { value: '7d', label: 'Weekly' },
                  { value: '30d', label: 'Monthly' },
                  { value: 'all', label: 'All time' }
                ]}
              />
            }
          >
            <Chart
              type='line'
              showLegend
              data={scrapeChartData}
              color={['blue', 'green', 'purple']}
            />
          </Card>
        </div>

      </div>

      {/* Scrape Configuration Modal */}
      <Dialog
        open={isConfigOpen}
        onClose={(res) => { if (res) setIsConfigOpen(false); }}
        title="Scrape Auto Configuration"
        description="These settings will be applied every time you run the scrape command."
      >
        <div className="space-y-6 py-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="autoRunTime">Auto run scrape every day at</Label>
            <Input
              id="autoRunTime"
              name="autoRunTime"
              type="time"
              value={config.autoRunTime}
              onChange={handleConfigChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoGenerateAnimation" className="flex-1">Auto generate a base animation for new games</Label>
            <Switch
              id="autoGenerateAnimation"
              name="autoGenerateAnimation"
              value={config.autoGenerateAnimation}
              onChange={handleSwitchChange}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="basePrompt">Add a base prompt for the animation</Label>
            <Input
              id="basePrompt"
              name="basePrompt"
              type="text"
              placeholder="e.g. realistic 3d coin spin"
              value={config.basePrompt}
              onChange={handleConfigChange}
              disabled={!config.autoGenerateAnimation}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoSave" className="flex-1">Auto save new games and assets in database</Label>
            <Switch
              id="autoSave"
              name="autoSave"
              value={config.autoSave}
              onChange={handleSwitchChange}
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button color='red' onClick={clearConfig}>
            Clear
          </Button>
          <Button color='green' onClick={saveConfig} disabled={!hasChanges}>
            Save
          </Button>
        </DialogFooter>
      </Dialog>
    </Animate>
  );
}
