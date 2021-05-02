// For more information on data-driven styles, see https://www.mapbox.com/help/gl-dds-ref/
const boundaryTrasitionZoomLevel = 13.5;
const highlightColor = '#f75a2f';

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
  id: 'trees',
  type: 'circle',
  minzoom: boundaryTrasitionZoomLevel,
  paint: {
      'circle-color': {
          type: 'identity',
          property: 'color'
      },
      'circle-radius': {
        property: 'diameter',
        stops: [
          [0, 6],
          [60, 12]
        ]
      },
      'circle-opacity': 0.7            
  }
};


// focus/highlight layers

export const boundariesHighlightLayer = {
  id: 'boundaries-focus',
  type: 'line',
  source: 'boundaries',
  paint: {
      'line-color': highlightColor,
      'line-width': 3
  }  
}

export const treesHighlightLayer = {
  id: 'tree-focus',
  type: 'circle',
  minzoom: boundaryTrasitionZoomLevel,
  source: 'trees',
  paint: {
      'circle-opacity': 0,
      'circle-stroke-width': 3,
      'circle-stroke-color': highlightColor,
      'circle-radius': {
        property: 'diameter',
        stops: [
          [0, 6],
          [60, 12]
        ]
      },  
  }  
}