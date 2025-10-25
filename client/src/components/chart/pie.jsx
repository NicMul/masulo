import 'chart.js/auto';
import { Chart } from 'react-chartjs-2';

export function PieChart({ data, options }){

  options.responsive = true;
  options.maintainAspectRatio = false;
  
  // Safely access scales properties
  if (options.scales?.x?.ticks) {
    options.scales.x.ticks.display = false;
  }
  if (options.scales?.y?.ticks) {
    options.scales.y.ticks.display = false;
  }
  if (options.scales?.x?.border) {
    options.scales.x.border.display = false;
  }
  if (options.scales?.y?.border) {
    options.scales.y.border.display = false;
  }

  return <Chart type='pie' data={ data } options={ options } />

}
