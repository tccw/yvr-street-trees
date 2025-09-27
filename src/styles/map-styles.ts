// For more information on data-driven styles, see https://www.mapbox.com/help/gl-dds-ref/
import { CircleLayer, FillLayer, HeatmapLayer, LineLayer, SymbolLayer } from 'react-map-gl';
// @ts-ignore
import { LAYER_NAME } from '../../env';


export const boundaryTrasitionZoomLevel = 13.5;
const highlightColor = '#f75a2f';
const DIAMETER_STOPS = [
  [{zoom: 12, value: 0}, 4],
  [{zoom: 12, value: 40}, 6],
  [{zoom: 14, value: 0}, 6],
  [{zoom: 14, value: 60}, 8],
  [{zoom: 16, value: 0}, 5],
  [{zoom: 16, value: 60}, 10],
  [{zoom: 19, value: 0}, 7],
  [{zoom: 19, value: 60}, 25]
];

export const boundariesLayer: FillLayer = {
  id: 'boundaries',
  type: 'fill',
  maxzoom: boundaryTrasitionZoomLevel,
  paint: {
    'fill-color': {
      type: 'identity',
      property: 'color'
    },
    'fill-opacity': 0.8,
    'fill-outline-color': 'white'
  }
};

export const centroidLayer: SymbolLayer = {
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
export const treesLayer: CircleLayer = {
  id: LAYER_NAME,
  type: 'circle',
  minzoom: boundaryTrasitionZoomLevel,
  'source-layer': LAYER_NAME,
  paint: {
    'circle-color': {
        type: 'identity',
        property: 'color'
    },
    'circle-stroke-color': '#FAF9F6',
    'circle-stroke-width': 1,
    'circle-radius': {
        property: 'diameter',
        stops: DIAMETER_STOPS
    },
    'circle-opacity': 0.75
  }
};


// focus/highlight layers

export const boundariesHighlightLayer: LineLayer = {
  id: 'boundaries-focus',
  type: 'line',
  source: 'boundaries',
  minzoom: boundaryTrasitionZoomLevel - 2,
  paint: {
      'line-color': highlightColor,
      'line-width': 3
  }
}

export const treesHighlightLayer: CircleLayer = {
  id: 'tree-focus',
  type: 'circle',
  minzoom: boundaryTrasitionZoomLevel,
  source: LAYER_NAME,
  'source-layer': LAYER_NAME,
  paint: {
      'circle-opacity': 0.75,
      'circle-stroke-width': 10,
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


const MAX_ZOOM_LEVEL = 20;
export const userPhotoHeatmapLayer: HeatmapLayer = {
    id: 'userphotos-heatmap',
    maxzoom: MAX_ZOOM_LEVEL,
    type: 'heatmap',
    paint: {
      // Increase the heatmap weight based on frequency and property magnitude
    //   'heatmap-weight': ['interpolate', ['linear'], ['get', 'size'], 0, 0, 80, 1],
      // Increase the heatmap color weight weight by zoom level
      // heatmap-intensity is a multiplier on top of heatmap-weight
    //   'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 2],
      // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
      // Begin color ramp at 0-stop with a 0-transparancy color
      // to create a blur-like effect.
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(7,12,134,0)',
        0.2,
        'rgb(98,0,166)',
        0.4,
        'rgb(168,34,150)',
        0.6,
        'rgb(200,62,75)',
        0.8,
        'rgb(249,144,8)',
        1,
        'rgb(246,250,149)'
      ],
      // Adjust the heatmap radius by zoom level
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 5, 30],
      'heatmap-opacity': 0.8
    }
  };

export const userPhotoCircleLayer: CircleLayer = {
    id: 'userphotos-data',
    type: "circle",
    maxzoom: MAX_ZOOM_LEVEL,
    paint: {
        'circle-opacity': 0,
        "circle-stroke-opacity": 0,
        'circle-radius': 10,
        'circle-color': 'black',
        'circle-stroke-color': '#FAF9F6',
        'circle-stroke-width': 3
    }
}

export const userPhotoHighlights: CircleLayer = {
    id: 'userphotos-highlights',
    type: "circle",
    source: 'userphotos-data',
    maxzoom: MAX_ZOOM_LEVEL,
    paint: {
        'circle-opacity': 0.7,
        "circle-stroke-opacity": 0.7,
        'circle-radius': 5,
        'circle-color': 'black',
        'circle-stroke-color': '#FAF9F6',
        'circle-stroke-width': 3
    }
}




// wide zoom styles

export const boundariesLayerWide = {...boundariesLayer, maxzoom: boundaryTrasitionZoomLevel - 5};
export const centroidLayerWide = {...centroidLayer, maxzoom: boundaryTrasitionZoomLevel - 5};
// to fix later: https://docs.mapbox.com/mapbox-gl-js/style-spec/other/
export const treesLayerWide = {...treesLayer, minzoom: boundaryTrasitionZoomLevel - 5};
export const treesHighlightLayerWide = {...treesHighlightLayer, minzoom: boundaryTrasitionZoomLevel - 5};
export const boundariesHighlightLayerWide = {...boundariesHighlightLayer, minzoom: boundaryTrasitionZoomLevel - 5};