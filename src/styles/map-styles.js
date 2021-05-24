// For more information on data-driven styles, see https://www.mapbox.com/help/gl-dds-ref/
import { LAYER_NAME } from '../../env'

const boundaryTrasitionZoomLevel = 12.5;
const highlightColor = '#f75a2f';
const DIAMETER_STOPS = [
  [{zoom: 12, value: 0}, 4],
  [{zoom: 12, value: 40}, 6],
  [{zoom: 14, value: 0}, 6],
  [{zoom: 14, value: 60}, 8],
  [{zoom: 16, value: 0}, 4],
  [{zoom: 16, value: 60}, 10],
  [{zoom: 19, value: 0}, 7],
  [{zoom: 19, value: 60}, 25]
];

export const boundariesLayer = {
  id: 'boundaries',
  type: 'fill',
  maxzoom: boundaryTrasitionZoomLevel,
  paint: {
    'fill-color': {
      type: 'identity',
      property: 'color'
    }, 
    'fill-opacity': 0.6
  }
};

export const centroidLayer = {
  id: 'centroids',
  type: 'symbol',
  maxzoom: boundaryTrasitionZoomLevel,
  layout: {
    'text-field': ['format', 
                      ['get', 'name'], 
                      { 'font-scale': 1.1 },  
                      '\n',
                      {},
                      ["number-format", ['get', 'tree_count'], {'local': 'string'}],
                      {
                          'font-scale': 0.85,
                      }
                  ],
    'text-font': ['Open Sans Bold']
  },
    paint: {
      'text-color': '#ffffff'
  }
};


// to fix later: https://docs.mapbox.com/mapbox-gl-js/style-spec/other/
export const treesLayer = {
  id: LAYER_NAME,
  type: 'circle',
  minzoom: boundaryTrasitionZoomLevel,
  'source-layer': LAYER_NAME,
  paint: {
      'circle-color': {
          type: 'identity',
          property: 'color'
      },
      'circle-radius': {
        property: 'diameter',
        stops: DIAMETER_STOPS
      },
      'circle-opacity': 0.75            
  }
};


// focus/highlight layers

export const boundariesHighlightLayer = {
  id: 'boundaries-focus',
  type: 'line',
  source: 'boundaries',
  maxzoom: boundaryTrasitionZoomLevel,
  paint: {
      'line-color': highlightColor,
      'line-width': 3
  }  
}

export const treesHighlightLayer = {
  id: 'tree-focus',
  type: 'circle',
  minzoom: boundaryTrasitionZoomLevel,
  source: LAYER_NAME,
  'source-layer': LAYER_NAME,
  paint: {
      'circle-opacity': 0.75,
      'circle-stroke-width': 3,
      'circle-stroke-color': highlightColor,
      'circle-radius': {
        property: 'diameter',
        stops: DIAMETER_STOPS
      },
      'circle-color': {
        type: 'identity',
        property: 'color'
    }
  }  
}