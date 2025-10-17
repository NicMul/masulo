/***
*
*   CHART
*   Responsive chart that supports multiple datasets and chart types.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/chart
*   https://www.chartjs.org/
*
*   PROPS
*   color: red/blue/purple/green - line color (string, required)
*   data: { labels: [], datasets: [{ label: string, data: [] }]} (object, required)
*   loading: toggle the loading spinner (boolean, optional)
*   showLegend: toggle the legend (boolean, optional)
*   type: line/bar/pie/donut/sparkline (string, required, default: line)
*
**********/

import { useState, useEffect, useContext, useMemo } from 'react';
import { LineChart } from './line';
import { BarChart } from './bar';
import { PieChart } from './pie';
import { DonutChart } from './donut';
import { SparkLineChart } from './sparkline';
import { AuthContext, Loader, Icon, useTranslation } from 'components/lib';

import Options from './options.json';
import Colors from './colors.json';
import { RoundTicks } from './methods';

export function Chart({ data, color, type = 'line', showLegend = false, loading }){

  // context
  const { t } = useTranslation();
  const authContext = useContext(AuthContext);

  // state
  const [legend, setLegend] = useState(null);
  const [chartData, setChartData] = useState(null);

  // update chart data
  useEffect(() => {

    setChartData(data);

  }, [data]);

  // set the colors
  useEffect(() => {

    if (chartData){

      setLegend(createLegend({ chartData, type }));
      
    }
  }, [chartData, color, type]);

  // chart types
  const charts = {

    line: LineChart,
    bar: BarChart,
    pie: PieChart,
    donut: DonutChart,
    sparkline: SparkLineChart

  }

  // config the options
  const ChartComponent = charts[type];

  const options = useMemo(() => {

    const chartOptions = JSON.parse(JSON.stringify(Options));
    chartOptions.scales.y.ticks.callback = RoundTicks;

    if (authContext.user.dark_mode){

      chartOptions.scales.y.ticks.color = 'white';
      chartOptions.scales.x.ticks.color = 'white';

    }

    return chartOptions;

  }, [authContext.user.dark_mode]);

  // chart is loading
  if (loading){
    return (
      <div className='relative min-h-[10rem] dark:text-slate-50'>
        <Loader/>
      </div>
    );
  }

  // no chart data – render blank slate
  if (!chartData?.datasets?.length){
    return (
      <div className='relative min-h-[10rem] dark:text-slate-50'>
        <div className='absolute top-1/2 left-1/2 text-center font-semibiold -translate-x-1/2 -translate-y-1/2'>
          <Icon name='bar-chart' className='block mx-auto mb-2'/>
          <span>{ t('global.chart.empty') }</span>  
        </div>
      </div>
    );
  }

  setChartColors({ chartData, type, color });

  // render the chart
  return (
    <div className='relative min-h-[10rem] dark:text-slate-50'>

      <div id='chart-tooltip'></div>
      { showLegend && <ul className='overflow-hidden mb-4'>{ legend }</ul> }

      <div className='h-[13.5em] m-h-[13.5em] cursor-pointer'>
        <ChartComponent data={ chartData } options={ options } />
      </div>

    </div>
  );
}

function setChartColors({ chartData, color, type }){

  // set the color
  let colors = [];

  // override with user-defined color
  if (color) {

    (Array.isArray(color) && color.length) ?
      colors.push(...color.map(col => Colors[col])) :
      colors.push(Colors[color]);

  }

  // set default color
  for (let color in Colors){

    colors.push(Colors[color]);

    chartData?.datasets?.forEach((ds, i) => {

      ds.borderColor = colors[i].borderColor;
      ds.backgroundColor = colors[i].backgroundColor[i];

      if (type === 'line'){

        ds.pointBackgroundColor = colors[i].pointBackgroundColor;
        ds.backgroundColor = colors[i].transparentColor;
        ds.pointRadius = colors[i].pointRadius;
        ds.pointHoverRadius = colors[i].pointHoverRadius;
        ds.pointBorderWidth = colors[i].pointBorderWidth;
        ds.pointBackgroundColor = colors[i].pointBackgroundColor;
        ds.pointHoverBackgroundColor = colors[i].pointHoverBackgroundColor;
        ds.pointHoverBorderColor = colors[i].pointHoverBorderColor;

      }

      if (type === 'sparkline'){

        ds.backgroundColor = 'transparent';
        ds.pointRadius = 0;
        ds.lineTension = 0;

      }

      if (type === 'pie' || type === 'donut'){

        ds.borderColor = '#FFFFFF';
        ds.hoverBorderColor = 'transparent';
        ds.backgroundColor = colors[i].backgroundColor;

      }
    });
  }
}

function createLegend({ chartData, type, ...props }){

  if (!chartData) return [];
  const isPieOrDonut = type === 'pie' || type === 'donut';

  // create the legend
  return (isPieOrDonut ? chartData.labels : chartData.datasets)?.map((item, index) => (
    <li key={item.label || item} className='float-left leading-4 mr-4 mb-3 text-sm'>

      <span 
        style={{ backgroundColor: isPieOrDonut ? chartData.datasets[0].backgroundColor[index] : item.borderColor }}
        className='relative inline-block w-3 h-3 top-px rounded-sm bg-slate-200 mr-2'
      />

      { item.label || item }

    </li>
  )) || [];
}