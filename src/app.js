import * as React from 'react';
import {render} from 'react-dom';
import Map from './components/map';


export default function App() {
  
  return (
      <Map></Map>
  );
}

export function renderToDom(container) {
  render(<App />, container);
}
