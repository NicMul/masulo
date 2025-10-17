// context must be in a separate file
// to prevent context being undefined 
// when hot reloading in vite

import { createContext } from 'react';
export const ViewContext = createContext();
