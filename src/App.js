import * as React from 'react';
import { useState, useEffect} from 'react';
import { render } from 'react-dom';
import MapGL, { Source, Layer } from 'react-map-gl'
import { dataLayer } from './map-style'

// const accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
// const boundaryGeoJSONURL = process.env.REACT_APP_BOUNDARIES;

const accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
const boundaryGeoJSONURL = process.env.REACT_APP_BOUNDARIES;

export default function App() {
  var bounds = [
    [-123.4027, 49.1067], // southwest coordinates
    [-122.7552, 49.4000] // northeast coordinates
  ]

  const [viewport, setViewport] = useState(
    {
      container: 'map', // container id
      latitude: 49.26,
      longitude:-123.2,
      zoom: 12.5, // starting zoom
      maxBounds: bounds
    }
  );
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    fetch(
      {boundaryGeoJSONURL}
    )
    .then(response => response.json())
    .then(json => setAllData(json));
  }, []);

  return (
    <>
      <MapGL
        {...viewport}
        width="100%"
        height="100%"
        mapStyle='mapbox://styles/tcowan/cknw84ogv1a3c17o0k0k9sd4y?optimize=true'
        mapboxApiAccessToken={accessToken}
        interactiveLayerIds={['data']}

      >
        <Source type="geojson" data={allData}>
          <Layer {...dataLayer}/>
        </Source>
      </MapGL>
    </>
  );
}

// export function renderToDom(container) {
//   render(<App />, container);
// }
