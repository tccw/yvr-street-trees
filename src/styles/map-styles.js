// For more information on data-driven styles, see https://www.mapbox.com/help/gl-dds-ref/
import { LAYER_NAME } from '../../env'

export const boundaryTrasitionZoomLevel = 13.5;
const highlightColor = '#f75a2f';
const DIAMETER_STOPS = [
  [{zoom: 12, value: 0}, 2],
  [{zoom: 12, value: 40}, 4],
  [{zoom: 14, value: 0}, 6],
  [{zoom: 14, value: 60}, 8],
  [{zoom: 16, value: 0}, 5],
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
    'fill-opacity': 0.8,
  }
};

export const centroidLayer = {
  id: 'centroids',
  type: 'symbol',
  maxzoom: boundaryTrasitionZoomLevel,
  layout: {
    'text-field': ['format',
                      ['get', 'name'],
                      { 'font-scale': 0.8 },
                      '\n',
                      {},
                      ["number-format", ['get', 'tree_count'], {'local': 'string'}],
                      {
                          'font-scale': 0.75,
                      }
                  ],
    'text-font': ['Open Sans Bold']
  },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': 'grey',
      'text-halo-width': 1
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
  minzoom: boundaryTrasitionZoomLevel - 2,
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



// wide zoom styles

export const boundariesLayerWide = {...boundariesLayer, maxzoom: boundaryTrasitionZoomLevel - 5};
export const centroidLayerWide = {...centroidLayer, maxzoom: boundaryTrasitionZoomLevel - 5};
// to fix later: https://docs.mapbox.com/mapbox-gl-js/style-spec/other/
export const treesLayerWide = {...treesLayer, minzoom: boundaryTrasitionZoomLevel - 5};
export const treesHighlightLayerWide = {...treesHighlightLayer, minzoom: boundaryTrasitionZoomLevel - 5};
export const boundariesHighlightLayerWide = {...boundariesHighlightLayer, minzoom: boundaryTrasitionZoomLevel - 5};