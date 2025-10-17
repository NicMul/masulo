import 'chart.js/auto';
import { Chart } from 'react-chartjs-2';

export function BarChart({ data, options }){

  options.maintainAspectRatio = false;
  options.responsive = true;

  return <Chart type='bar' data={ data } options={ options } />

}
