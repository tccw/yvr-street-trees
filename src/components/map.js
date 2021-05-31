import * as React from 'react';
import {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import styled from 'styled-components';
import MapGL, {
    Source,
    Layer,
    LinearInterpolator,
    WebMercatorViewport,
    NavigationControl,
    GeolocateControl,
    AttributionControl} from 'react-map-gl';
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import Geocoder from 'react-map-gl-geocoder';
import bbox from '@turf/bbox'
import {FilterPanel} from './filter-panel';
import TreeInfoContainer from './tree-info-container';
import InfoPanel from './info-panel';
import BoundaryStats from './boundary-stats';
import MapStyleToggle from './map-style-toggle';

import { MAPBOX_TOKEN,
         VAN_BOUNDARIES_URL,
         VAN_ALL_TREES_TILES,
         LAYER_NAME, GEOCODER_PROXIMITY,
         TREE_BLURB_URL, MAP_STYLE_PARKS,
         MAP_STYLE_CONTRAST, MAP_STYLE_SATELLITE, STATS } from '../../env'

import { titleCase, treeFilterCompositor, getTreeStats } from '../utils';
import {boundariesLayer, centroidLayer, treesLayer, boundariesHighlightLayer, treesHighlightLayer} from '../styles/map-styles.js';
import {useContainerDimensions} from '../hooks/useContainerDimensions';

const TOKEN = MAPBOX_TOKEN; // Set the mapbox token here
const DEFAULT_TITLE = `Vancouver Street Trees`;
const MAX_ZOOM = 18.5;
const MIN_ZOOM = 11;
const GEOLOCATE_POS_OPTIONS = {enableHighAccuracy: true};
const geolocateStyle = {
    bottom: 168,
    right: 0,
    padding: '10px'
};

const navStyle = {
    bottom: 72,
    right: 0,
    padding: '10px'
};

const BOUNDS = [ [ -122.821261, 49.35818], [ -123.413509, 49.149992 ] ]

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

const FilterToTree = styled.span`
    font-size: 1.1rem;
    margin-left: 20px;
    margin-bottom: 20px;
    border-bottom: 0.2rem solid var(--color);
    float: right;
    width: -moz-fit-content;
    width: fit-content;
    display: table;

    &:hover {
        color: darkgrey;
        cursor: pointer;
    }
`;

const attributionStyle = {
    position: 'absolute',
    bottom: '30px',
    right: '50px'
}


export default function Map() {
    // references
    const mapRef = useRef();
    const infoPanelRef = useRef();

    // state
    const [style, setStyle] = useState(MAP_STYLE_PARKS);
    const [viewport, setViewport] = useState({
        latitude: GEOCODER_PROXIMITY.latitude,
        longitude: GEOCODER_PROXIMITY.longitude,
        zoom: 11.5,
        bearing: 0,
        pitch: 0,
        maxZoom: MAX_ZOOM,
        minZoom: MIN_ZOOM,
        maxbounds: BOUNDS
    });
    const [boundaries, setBoundaries] = useState(null);
    const [centroids, setCentroids]   = useState(null);
    const [hoverInfo, setHoverInfo]   = useState(null);
    const [selected, setSelected]     = useState(null);
    const [title, setTitle]           = useState(DEFAULT_TITLE)
    const [treeFilterObject, setTreeFilterObject] = useState({trees: null, diameters: null, height_ids: null})
    const [filterPanelSelected, setFilterPanelSelected] = useState(false);
    const [stats, setStats] = useState(null);
    const [blurbs, setBlurbs] = useState(null);
    const [defaultValue, setDefaultValue] = useState([]); // lifted state from filter-panel. Allows for synchronization between
    const [isInfoPanelExpanded, setIsInfoPanelExpanded] = useState(true);

    // custom hooks
    const { width } = useContainerDimensions(infoPanelRef);

    /* fetch Vancouver tree related data */
    useEffect(() => {
        fetch(VAN_BOUNDARIES_URL)
            .then(response => response.json())
            .then(json => {
                // create the centroids for labeling neighborhoods
                let centroids = {
                    type: "FeatureCollection",
                    features: []
                }
                for (let i = 0; i < json.features.length; i++) {
                    centroids.features.push(
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: json.features[i].properties.geo_point_2d.reverse()
                            },
                            properties: {
                                name: json.features[i].properties.name,
                                tree_count: json.features[i].properties.tree_count
                            }
                        }
                    )
                }
                setBoundaries(json);
                setCentroids(centroids);
            });
    }, []);

    useEffect(() => {
        fetch(TREE_BLURB_URL)
            .then(response => response.json())
            .then(json => setBlurbs(json));
    }, [])

    useEffect(() => {
        fetch(STATS)
            .then(response => response.json()
            .then(json => setStats(json)))
    }, [])

    /**
     * For local CORS errors, use: gsutil defacl ch -u AllUsers:R gs://<bucket> to fix
     * https://stackoverflow.com/questions/62246717/public-url-of-google-cloud-storage-access-denied
     * Also set a CORS configuration
     * and use <bucket-name>.storage.googleapis rather than storage.googleapis.com/<bucket-name>
     * as the first has CORS headers and the second does not.
     *
     * https://cloud.google.com/storage/docs/cross-origin
     *
     * */


    /** set up a slick mouse hover info box */
    const onHover = useCallback(event => {
        if ( ! [...event.target.classList].some(name => name.includes('geocoder')) ) {
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
        }
    }, []);

    const handleGeocoderViewportChange = useCallback((newViewport) => {
        const options = { transitionDuration: 1000, maxZoom: MAX_ZOOM};
        setViewport({
            ...newViewport,
            ...options
        });
    }, []);

    const onClickZoom = event => {
        // this stops clicks from propogating through the geocoder search box to the map below
        // the DomTokenList has to be spread and cast to an array in order to use some()
        if ( ! [...event.target.classList].some(name => name.includes('geocoder')) ) {
            const feature = event.features && event.features[0];

            if (feature) {
                // calculate the bounding box of the feature
                const [minLng, minLat, maxLng, maxLat] = bbox(feature);
                // construct a viewport instance from the current state
                const vp = new WebMercatorViewport(viewport);
                // create options based on layer type id
                var options = { padding: 100, maxZoom: 14.5 };
                if (feature.layer.id == LAYER_NAME) {
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

                if (! isInfoPanelExpanded) {
                    handleToggleInfoPanel();
                }

                setTitle(titleCase(feature.layer.id == LAYER_NAME ? feature.properties.common_name : feature.properties.name))

            } else {
                setTitle(DEFAULT_TITLE);
            }

            // update selected
            setSelected (feature || null);
            setFilterPanelSelected(Boolean(feature));
        }
    };

    const onClickFilter = () => {
        setDefaultValue(defaultValue.filter((entry) => (entry.value === selected.properties.common_name)));
        setTreeFilterObject(selected
                                ? {...treeFilterObject, trees: [selected.properties.common_name]} // only replace the trees object
                                : {...treeFilterObject , trees: null});
    }

    /**
     * Memoize this function so that it can be used as a dependancy for setting padding.
     * Depending solely on the isInfoPanelExpanded state did not handle the following edge case
     * CASE:
     *  - collapse info-panel
     *  - click on tree (zoom to and force open panel)
     * The tree padding function would use the wrong padding to center the item and
     * would not update until there was another expand/collapse or a resize event.
     */
    const handleToggleInfoPanel = useCallback(() => {
        setIsInfoPanelExpanded(! isInfoPanelExpanded)
    })

    /**
     * This seems like a TERRIBLE way to handle the following edge case:
     * treeFiterObject is updated onClickFilter, but since this update no longer occurs
     * in the onClickZoom arrow function, clicking off the tree no longer clears the filter.
     *
     * This useEffect is triggered when selected changes, and clears the tree filter if nothing is selected
     */
    useEffect(() => {
        if (! selected && ! filterPanelSelected) {
            setDefaultValue([]);
            setTreeFilterObject({...treeFilterObject , trees: null});
        }
    }, [selected, filterPanelSelected]);

    useEffect(() => {
        /**
         * Padding in fitBounds and padding here do not appear to be the same.
         * Directly accessing the Map within the DOM and using easeTo seems to the
         * only way I can utilize padding to center viewport from the user's perspective
         * as described here: https://github.com/mapbox/mapbox-gl-js/pull/8638
         */
        isInfoPanelExpanded
            ? mapRef.current.getMap().easeTo({padding: {left: width}})
            : mapRef.current.getMap().easeTo({padding: {left: 0}});

    }, [width, handleToggleInfoPanel]);

    var selection = '';
    if (selected && selected.layer.id == 'boundaries') {
        selection = selected.properties.name;
    } else if (selected && selected.layer.id == LAYER_NAME) {
        selection = selected.properties.tree_id;
    }

    // memoized filters
    const boundaryHighlightFilter = useMemo(() => ['==', ['get', 'name'], selection], [selection]);
    const treeHighlightFilter = useMemo(() => ['==', ['get', 'tree_id'], selection], [selection]);
    const treeFilter = useMemo(() => treeFilterCompositor(treeFilterObject, selected))

    return (
        <>
            <MapGL
                ref={mapRef}
                {...viewport}
                width="100%"
                height="100%"
                mapStyle={style}
                onViewportChange={setViewport}
                mapboxApiAccessToken={TOKEN}
                interactiveLayerIds={['boundaries', LAYER_NAME]} // centroids are only labels, not interacitve elements
                onHover={onHover}
                onClick={onClickZoom}
                onZoom
                dragRotate={false}
                touchRotate={false}
                attributionControl={false} // handled with the footer

            >
                <Geocoder
                    mapRef={mapRef}
                    mapboxApiAccessToken={MAPBOX_TOKEN}
                    position='top-right'
                    onViewportChange={handleGeocoderViewportChange}
                    placeholder="Search Address"
                    proximity={GEOCODER_PROXIMITY}
                    country='CANADA'>
                </Geocoder>
                <Source type="geojson" data={boundaries}>
                    <Layer {...boundariesLayer}/>
                    <Layer {...boundariesHighlightLayer} filter={boundaryHighlightFilter}/>
                </Source>
                <Source type="geojson" data={centroids}>
                    <Layer {...centroidLayer} />
                </Source>
                <Source type="vector" url={VAN_ALL_TREES_TILES}>
                    <Layer {...treesLayer} filter={treeFilter}/>
                    <Layer {...treesHighlightLayer} filter={treeHighlightFilter} />
                </Source>
                {hoverInfo && hoverInfo.feature.layer.id == LAYER_NAME && (
                <ToolTip x={hoverInfo.x} y={hoverInfo.y}>
                    <div>{titleCase(hoverInfo.feature.properties.common_name)}</div>
                </ToolTip>
                )}
                <GeolocateControl
                    style={geolocateStyle}
                    positionOptions={GEOLOCATE_POS_OPTIONS}
                    trackUserLocation
                    label="Toggle Find My Location"
                    onViewportChange={handleGeocoderViewportChange}
                />
                {/* <FullscreenControl style={fullscreenControlStyle} /> */}
                <NavigationControl style={navStyle} />
                <AttributionControl style={attributionStyle}/>

            </MapGL>
            <MapStyleToggle setStyle={setStyle} styles={[MAP_STYLE_PARKS, MAP_STYLE_CONTRAST, MAP_STYLE_SATELLITE]}/>
            {/* Put these components inside MapGL to be available in fullscreen, but figure out class name assignment to avoid click-through to the map */}
            <InfoPanel ref={infoPanelRef}
                            title={title} isExpanded={isInfoPanelExpanded} handleToggle={handleToggleInfoPanel}
                            color={(selected && selected.layer.id == LAYER_NAME) ? selected.properties.color : ''}>
                        {selected && selected.layer.id == 'boundaries' &&
                            <BoundaryStats currentState={treeFilterObject}
                                        updateParent={(props) => setTreeFilterObject({...props})}
                                        {...selected.properties}
                                        heading='Neighborhood'
                                        stats={stats}>
                            </BoundaryStats>
                        }
                        {selected && selected.layer.id == LAYER_NAME &&
                                <TreeInfoContainer {...selected.properties} stats={stats} blurbs={blurbs}>
                                    <FilterToTree onClick={onClickFilter} style={{'--color': selected.properties.color}}>
                                        View  all <b>{titleCase(selected.properties.common_name)}</b> trees on the map
                                    </FilterToTree>
                                </TreeInfoContainer>
                            }
                </InfoPanel>
                <FilterPanel currentState={treeFilterObject} className="damnwhataname"
                         updateParent={(props) => setTreeFilterObject({...props})}
                         updateSelected={() => setFilterPanelSelected(true)}
                         Selected={selected} // so that clicking the map can also deselect the tree from the list
                         treeNamesAndColors={stats ? stats.tree_stats : null}
                         defaultValue={defaultValue}
                         setDefaultValue={(value) => setDefaultValue(value)}
                         currentZoom={viewport.zoom} >
                </FilterPanel>
        </>
    );
}

