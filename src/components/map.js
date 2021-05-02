import * as React from 'react';
import {useState, useEffect, useMemo, useCallback} from 'react';
import styled from 'styled-components';
import MapGL, {Source, Layer, LinearInterpolator, WebMercatorViewport} from 'react-map-gl';
import bbox from '@turf/bbox'
import ControlPanel from './control-panel';
import {TreeInfoContainer} from './tree-info-container';
import InfoPanel from './info-panel';
import { MAPBOX_TOKEN, 
         VAN_BOUNDARIES_URL, 
         VAN_BOUNDARY_CENTROID_URL, 
         WEST_POINT_TREES_URL, 
         VAN_ALL_TREES_URL } from '../../env'

import { titleCase, heightStringFromID } from '../utils';
import {boundariesLayer, centroidLayer, treesLayer, boundariesHighlightLayer, treesHighlightLayer} from '../map-styles.js';

const TOKEN = MAPBOX_TOKEN; // Set the mapbox token here
const DEFAULT_TITLE = `Vancouver's Street Trees`;

const ToolTip = styled.div`
    position: absolute;
    margin: 8px;
    padding: 4px;
    border-radius: 5%;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    max-width: 300px;
    font-size: 14px;
    z-index: 9;
    pointer-events: none;
    text-transform: capitalize;
    left: ${props => (props.x)}px;
    top: ${props => (props.y)}px;
`;

export default function Map() {

    const [viewport, setViewport] = useState({
        latitude: 49.265,
        longitude: -123.20,
        zoom: 15.5,
        bearing: 0,
        pitch: 0
    });
    const [year, setYear] = useState(2015);
    const [boundaries, setBoundaries] = useState(null);
    const [centroids, setCentroids]   = useState(null);
    const [trees, setTrees]           = useState(null);
    const [hoverInfo, setHoverInfo]   = useState(null);
    const [selected, setSelected]     = useState(null);
    const [title, setTitle]           = useState(DEFAULT_TITLE)

    /* fetch Vancouver tree related data */
    useEffect(() => {
        fetch(VAN_BOUNDARIES_URL)
            .then(response => response.json())
            .then(json => setBoundaries(json));
    }, []);

    useEffect(() => {
        fetch( VAN_BOUNDARY_CENTROID_URL)
            .then(response => response.json())
            .then(json => setCentroids(json));
    }, []);

    /** 
     * For local CORS errors, use: gsutil defacl ch -u AllUsers:R gs://<bucket> to fix 
     * Also set a CORS configuration
     * and use <bucket-name>.storage.googleapis rather than storage.googleapis.com/<bucket-name>
     * as the first has CORS headers and the second does not. 
     * 
     * https://cloud.google.com/storage/docs/cross-origin
     * 
     * */
    useEffect(() => {
        fetch( WEST_POINT_TREES_URL || VAN_ALL_TREES_URL )
        .then(response => response.json())
        .then(json => setTrees(json))
        .catch((error) => {
            console.error('Error:', error);
        });
    }, []);

    /** set up a slick mouse hover info box */
    const onHover = useCallback(event => {
        const {
        features,
        srcEvent: {offsetX, offsetY}
        } = event;
        const hoveredFeature = features && features[0];
        
        setHoverInfo(
        hoveredFeature
            ? {
                feature: hoveredFeature,
                x: offsetX,
                y: offsetY
            }
            : null
        );
    }, []);

    const onClick = event => {
        var feature = event.features[0];
        
        if (feature) {            
            // calculate the bounding box of the feature
            const [minLng, minLat, maxLng, maxLat] = bbox(feature);
            // construct a viewport instance from the current state
            const vp = new WebMercatorViewport(viewport);
            // create options based on layer type id
            var options = {padding: 40, maxZoom:13.5 };
            if (feature.layer.id == 'trees') {
                options.maxZoom = 17;
            }
            const {longitude, latitude, zoom} = vp.fitBounds(
              [
                [minLng, minLat],
                [maxLng, maxLat]
              ],
              options
            );
      
            // update the viewport  
            setViewport({
              ...viewport,
              longitude,
              latitude,
              zoom,
              transitionInterpolator: new LinearInterpolator({
                around: [event.offsetCenter.x, event.offsetCenter.y]
              }),
              transitionDuration: 650
            });

            setTitle(titleCase(feature.layer.id == 'trees' ? feature.properties.common_name : feature.properties.name))
          } else {
              setTitle(DEFAULT_TITLE);
          }

          // update selected
          setSelected (feature || null);
    };

    var selection = '';
    if (selected && selected.layer.id == 'boundaries') {
        selection = selected.properties.name;
    } else if (selected && selected.layer.id == 'trees') {
        selection = selected.properties.tree_id
    }

    const boundaryFilter = useMemo(() => ['in', 'name', selection], [selection]);
    const treeFilter = useMemo(() => ['in', 'tree_id', selection], [selection])

    return (
        <>
            <MapGL
                {...viewport}
                width="100%"
                height="100%"
                mapStyle="mapbox://styles/tcowan/cknw84ogv1a3c17o0k0k9sd4y?optimize=true"
                onViewportChange={setViewport}
                mapboxApiAccessToken={TOKEN}
                interactiveLayerIds={['boundaries', 'trees']} // centroids are only labels, not interacitve elements
                onHover={onHover}
                onClick={onClick}
            >
                <Source type="geojson" data={boundaries}>
                    <Layer {...boundariesLayer} />
                    <Layer {...boundariesHighlightLayer} filter={boundaryFilter}/>
                </Source>
                <Source type="geojson" data={centroids}>
                    <Layer {...centroidLayer} />
                </Source>
                <Source type="geojson" data={trees}>
                    <Layer {...treesLayer} />
                    <Layer {...treesHighlightLayer} filter={treeFilter} />
                </Source>
                {hoverInfo && hoverInfo.feature.layer.id == "trees" && (
                <ToolTip x={hoverInfo.x} y={hoverInfo.y}>
                    <div>{titleCase(hoverInfo.feature.properties.common_name)}</div>
                </ToolTip>
                )}
            </MapGL>

            <ControlPanel year={year} onChange={value => setYear(value)} />
            <InfoPanel title={title} 
                       color={(selected && selected.layer.id == 'trees') ? selected.properties.color : ''}>    
                {selected && selected.layer.id == "trees" &&
                        <TreeInfoContainer {...selected.properties} ></TreeInfoContainer>
                    }            
            </InfoPanel>
            
        </>
    );
}

