import * as React from 'react';
import {render} from 'react-dom';
import Map from './components/map';
import Footer from './components/footer';
import "regenerator-runtime/runtime.js"; // for async support with Babel


export default function App() {

  return (
    <>
      <Map/>
      <Footer/>
    </>
  );
}

export function renderToDom(container) {
  render(<App />, container);
}
