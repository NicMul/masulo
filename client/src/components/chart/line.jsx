import 'chart.js/auto';
import { Chart } from 'react-chartjs-2';

export function LineChart({ data, options }){

  options.maintainAspectRatio = false;
  options.responsive = true;

  return <Chart type='line' data={ data } options={ options } />

}
