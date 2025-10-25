import 'chart.js/auto';
import { Chart } from 'react-chartjs-2';

export function SparkLineChart({ data, options }){

  // Safely access scales properties
  if (options.scales?.y) {
    options.scales.y.display = false;
  }
  if (options.scales?.x) {
    options.scales.x.display = false;
  }
  
  options.maintainAspectRatio = false;
  options.responsive = true;

  return <Chart type='line' data={ data } options={ options }/>

}
