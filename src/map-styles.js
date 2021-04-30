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
                      ['get', 'tree_count'],
                      {
                          'font-scale': 0.9,
                      }
                  ],
    'text-font': ['Open Sans Bold']
  },
    paint: {
      'text-color': '#ffffff'
  }
};

export const treesLayer = {
  id: 'trees',
  type: 'circle',
  minzoom: boundaryTrasitionZoomLevel,
  paint: {
      'circle-color': {
          type: 'identity',
          property: 'color'
      },
      'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          12, ['/', ['+', ['%', 6, ['get', 'diameter']], 10], 4],
          18, ['/', ['+', ['%', 15, ['get', 'diameter']], 15], 2]
      ],
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
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        12, ['/', ['+', ['%', 6, ['get', 'diameter']], 10], 4],
        18, ['/', ['+', ['%', 15, ['get', 'diameter']], 15], 2]
    ],  
  }  
}