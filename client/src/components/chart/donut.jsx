import 'chart.js/auto';
import { Chart } from 'react-chartjs-2';

export function DonutChart({ data, options }) {

  options.responsive = true;
  options.maintainAspectRatio = false;
  
  // Safely access scales properties
  if (options.scales?.x?.ticks) {
    options.scales.x.ticks.display = false; 
  }
  if (options.scales?.y?.ticks) {
    options.scales.y.ticks.display = false;
  }
  if (options.scales?.x) {
    options.scales.x.display = false;
  }
  if (options.scales?.y) {
    options.scales.y.display = false;
  }

  return <Chart type='doughnut' data={ data } options={ options } />

}
