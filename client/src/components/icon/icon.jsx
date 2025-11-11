/***
*
*   ICON
*   Render an icon from Lucide react.
*   Icons are lazy loaded to prevent increasing bundle size.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/icon
*   https://lucide.dev
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   color: outline color (hex string, optional)
*   fill: fill color (hex string, optional)
*   name: icon image to use (see: https://lucide.dev/icons/)
*   size: icon size (integer, required, default: 16)
*
**********/

import { lazy, Suspense, useMemo } from 'react'

export function Icon({ className, name, color, size, fill }){

  // capitalise first letter
  name = name ? name.charAt(0).toUpperCase() + name.slice(1) : false;

  // convert kebab case to pascal case?
  if (name && name.includes('-'))
    name = name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  
  const colors = {

    light: '#fff',
    dark: '#475569',
    green: '#10b981',
    blue: '#3b82f6',
    orange: '#f97316',
    red: '#ef4444'
    
  };

  color = colors[color] || color;

  const Icon = useMemo(() => {
    
    return lazy(async () => {
      
      const module = await import('lucide-react')

      if (module && module[name]) { 
        
        // check module is defined and contains the icon
        return { default: module[name] };

      } 
      else {

        console.log(`Icon '${name}' not found.`);
        return { default: () => null }; // fallback 

      }
    });
  }, [name]);

  return (
    <Suspense fallback={<div></div>}>
      <Icon 
        size={ size || 16 }
        className={ className } 
        {...fill && { fill: fill }}
        {...color && { color: color }} 
      /> 
    </Suspense> 
  )
 
}

