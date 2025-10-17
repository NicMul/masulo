/***
*
*   EVENT
*   Log a client-side event
*   
*   PROPS
*   name: name of the event (string, required)
*   metadata: additional data to save (object, optional)
*
**********/

import Axios from 'axios';

export function Event({ name, metadata }){

  Axios.post('/api/event', { name, metadata });

}