import InfoPanel from "../InfoPanel/index";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Map, {
  Source,
  Layer,
  MapRef,
  ViewState,
  Marker,
  NavigationControl,
  AttributionControl,
  GeolocateControl,
  MarkerDragEvent,
} from "react-map-gl";
import mapboxgl, { EventData, MapLayerMouseEvent } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import bbox from "@turf/bbox";
import { InfoContainer } from "../InfoContainer";
import { ToolTip, layerStyle, highlightStyle, FilterToTree } from "./styles";
import { Blurb } from "../InfoContainer/styles";
import { useWindowSize } from "../../hooks/useWindowSize";
import { useMeasure } from "@react-hookz/web";
import FilterPanel from "../FilterPanel";
import {
  filterValidForWideZoom,
  titleCase,
  treeFilterCompositor,
} from "../../utils/utils";
import UserPhotoMarker from "../UserPhoto";
import {
  MAPBOX_TOKEN,
  VAN_BOUNDARIES_URL,
  VAN_ALL_TREES_TILES,
  LAYER_NAME as TREE_LAYER_NAME,
  GEOCODER_PROXIMITY,
  TREE_BLURB_URL,
  MAP_STYLE_PARKS,
  MAP_STYLE_CONTRAST,
  MAP_STYLE_SATELLITE,
  STATS,
  WELCOME_MSG,
  CLOUD_NAME
} from "../../../env";
import {
  circle,
  Feature,
  FeatureCollection,
  Geometry,
  GeometryCollection,
  pointsWithinPolygon,
  Position,
  Properties,
  Units,
} from "@turf/turf";
import {
  boundariesHighlightLayer,
  boundariesHighlightLayerWide,
  boundariesLayer,
  boundariesLayerWide,
  centroidLayer,
  centroidLayerWide,
  treesHighlightLayer,
  treesHighlightLayerWide,
  treesLayer,
  treesLayerWide,
  userPhotoCircleLayer,
  userPhotoHeatmapLayer,
  userPhotoHighlights,
} from "../../styles/map-styles";
import { TreeFilter } from "../Types";
import BoundaryStats from "../BoundaryStats";
import UserImageGrid from "../UserPhotoGrid";
import MapStyleToggle from "../MapStyleToggle";
import GeocoderControl from "../../geocoder-control";
import ImageUploader from "../ImageUploader";
import { Client } from "../../api-client/client";
import SelfLocatePin from "../SelfLocatePin";
import { UploadImageFile } from "../../handlers/map-handlers";
import LocationDialog from "../LocationDialog";
import LocationSelectSenderButton from "../LocationSelectSenderBotton";
import LocationSelectMarker from "../LocationSelectMarker";
import { padding } from "@mui/system";

const LAYER_NAME = "vancouver-all-trees-processed-5ovmz9";
export const DEFAULT_TITLE = `Vancouver Street Trees`;
const MAX_ZOOM = 18.5;
const MIN_ZOOM = 11;
const GEOLOCATE_POS_OPTIONS = { enableHighAccuracy: true };
const geolocateStyle = {
  bottom: 168,
  right: 0,
  padding: "10px",
};

const navStyle = {
  bottom: 72,
  right: 0,
  padding: "10px",
};

const attributionStyle = {
  position: "absolute",
  bottom: "30px",
  right: "50px",
};

const BOUNDS = [
  [-123.413509, 49.149992],
  [-122.821261, 49.35818],
];

const apiClient = new Client();

function MapComponent() {
  const mapRef = useRef<MapRef>(null);
  const [boundaries, setBoundaries] = useState<FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  const [centroids, setCentroids] = useState<FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  const [blurbs, setBlurbs] = useState<object>({});
  const [stats, setStats] = useState<object>({});
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [userPhotoId, setUserPhotoId] = useState<number>(0);
  const [defaultValue, setDefaultValue] = useState<any[]>([]); // lifted state from filter-panel. Allows for synchronization between
  const [filterPanelSelected, setFilterPanelSelected] = useState(false);
  const [style, setStyle] = useState(MAP_STYLE_CONTRAST);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [interactiveLayers, setInteractiveLayers] = useState<string[]>([]);

  const [userInputPosVisible, setUserInputPosVisible] = useState<boolean>(false);
  const [allData, setAllData] = useState<any>();
  const [hoverInfo, setHoverInfo] = useState<any>();
  const [isInfoPanelExpanded, setIsInfoPanelExpanded] = useState(true);
  const [selected, setSelected] = useState<any>();
  const [cursor, setCursor] = useState<string>("grab");
  const [treeFilterObject, setTreeFilterObject] = useState<TreeFilter>({
    trees: [],
    diameters: [0, 42],
    height_ids: [0,1,2,3,4,5,6,7,8,9,10],
  });
  const [viewState, setViewState] = useState<ViewState>({
    latitude: GEOCODER_PROXIMITY.latitude,
    longitude: GEOCODER_PROXIMITY.longitude,
    zoom: 11.5,
    bearing: 0,
    pitch: 0,
    padding: { left: 0, top: 0, right: 0, bottom: 0 },
  });
  const [marker, setMarker] = useState({
    latitude: GEOCODER_PROXIMITY.latitude,
    longitude: GEOCODER_PROXIMITY.longitude
  });
  const onMarkerDrag = useCallback((event: MarkerDragEvent) => {
    setMarker({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat
    });
  }, []);

  const handleNoPositionUpload = (userFile: Blob) => {
    setUserInputPosVisible(true);
    setMarker({ latitude: viewState.latitude, longitude: viewState.longitude });
    setIsInfoPanelExpanded(false);
    setViewState({ ...viewState, padding: { left: 0, top: 0, right: 0, bottom: 0 } } )
  }

  // fetch data
  /* fetch Vancouver tree related data */
  useEffect(() => {
    fetch(VAN_BOUNDARIES_URL)
      .then((response) => response.json())
      .then((json) => {
        // create the centroids for labeling neighborhoods
        let centroids: FeatureCollection = {
          type: "FeatureCollection",
          features: [],
        };
        for (let i = 0; i < json.features.length; i++) {
          centroids.features.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: json.features[i].properties.geo_point_2d.reverse(),
            },
            properties: {
              name: json.features[i].properties.name,
              tree_count: json.features[i].properties.tree_count,
            },
          });
        }
        setBoundaries(json);
        setCentroids(centroids);
      });
  }, []);

  useEffect(() => {
    fetch(TREE_BLURB_URL)
      .then((response) => response.json())
      .then((json) => setBlurbs(json));
  }, []);

  useEffect(() => {
    fetch(STATS).then((response) =>
      response.json().then((json) => setStats(json))
    );
  }, []);

  // state
  const [userPhotoList, setUserPhotoList] = useState<
    FeatureCollection<Geometry | GeometryCollection, Properties> | Array<any>
  >({
    type: "FeatureCollection",
    features: [],
  });

/* As a second example, an API call inside an useEffect with fetch: */
useEffect(() => {
    const fetchUserPhotos = async () => {
        apiClient.userphotos.getUserPhotos()
            .then(response => setUserPhotoList(response.data))
            .catch(error => console.log(error));
    };

    fetchUserPhotos();

    // return () => new AbortController().abort();
}, []);

  // window geometry related hooks
  const isNarrow = useWindowSize(600);
  const [measurements, infoPanelRef] = useMeasure<HTMLDivElement>();

  // memoized filters
  const selectedRecord = (selected && selected.properties.recordId) || "";
  const highlightFilter = useMemo(
    () => ["==", ["get", "recordId"], selectedRecord],
    [selectedRecord]
  );

  const onHover = useCallback((event: any) => {
    const {
      features,
      point: { x, y },
    } = event;
    const hoveredFeature = features && features[0];

    // prettier-ignore
    setHoverInfo(hoveredFeature && { feature: hoveredFeature, x, y });
  }, []);

  //   const handleGeocoderViewportChange = useCallback((newViewport: ViewState) => {
  //     const options = { transitionDuration: 1000, maxZoom: MAX_ZOOM };
  //     setViewState({
  //       ...newViewport,
  //       ...options,
  //     });
  //   }, []);

  const onSelectZoom = (event: MapLayerMouseEvent) => {
    const feature = event.features && event.features[0];

    if (feature && feature.properties) {
      // calculate the bounding box of the feature
      const [minLng, minLat, maxLng, maxLat] = bbox(feature);
      const easeToDuration = 650;

      var options = {
        padding: { left: 10, top: 10, right: 10, bottom: 10 },
        maxZoom: feature.layer.id === TREE_LAYER_NAME ? 17 : 14.5,
        linear: true,
        duration: easeToDuration,
      };

      if (mapRef.current) {
        var { longitude, latitude, zoom }: EventData = mapRef.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          options
        );

        // zoom = zoom < viewState.zoom ? zoom : viewState.zoom;

        // update the viewport
        setViewState({
            ...viewState,
            longitude,
            latitude,
            zoom,
            });

        if (!isInfoPanelExpanded) {
          setIsInfoPanelExpanded(true);
        }

        let title;
        switch (feature.layer.id) {
          case TREE_LAYER_NAME:
            title = feature.properties.common_name;
            break;
          case "userphotos-data":
            title = "User Photos!";
            break;
          case "boundaries":
            title = feature.properties.name;
            break;
          default:
            title = DEFAULT_TITLE;
        }
        setTitle(titleCase(title));
      }
    } else {
      setTitle(DEFAULT_TITLE);
    }

    setSelected(feature || null);
    setFilterPanelSelected(Boolean(feature));
    if (!feature) {
      setTreeFilterObject({
        ...treeFilterObject,
        trees: [],
      });
    }
    infoPanelRef.current?.scrollTo(0,0);
    // if (infoPanelRef && infoPanelRef.current)
    //   infoPanelRef.current.scrollTo(0, 0);
  };

  const handleToggleInfoPanel = useCallback(
    () => {
        if (!isInfoPanelExpanded)
            infoPanelRef.current?.scrollTo(0,0);
        setIsInfoPanelExpanded(!isInfoPanelExpanded)

    },
    [isInfoPanelExpanded]
  );

  useEffect(() => {
    /**
     * Padding in fitBounds and padding here do not appear to be the same.
     * Directly accessing the Map within the DOM and using easeTo seems to be the
     * only way I can utilize padding to center viewport from the user's perspective
     * as described here: https://github.com/mapbox/mapbox-gl-js/pull/8638
     */
    if (mapRef && mapRef.current && measurements)
      isInfoPanelExpanded
        ? mapRef.current.getMap().easeTo({
            padding: isNarrow
              ? { left: 100, top: 100, right: 100, bottom: measurements.height }
              : { left: measurements.width, top: 100, right: 100, bottom: 100 },
            essential: true
          })
        : mapRef.current.getMap().easeTo({
            padding: isNarrow
              ? { left: 100, top: 100, right: 100, bottom: 0 }
              : { left: 0, top: 100, right: 100, bottom: 100 },
              essential: true
          });
  }, [measurements?.width, handleToggleInfoPanel]);

  const onMouseEnter = useCallback(() => setCursor("pointer"), []);
  const onMouseLeave = useCallback(() => setCursor("grab"), []);
  const filter = useMemo(
    () => treeFilterCompositor(treeFilterObject),
    [treeFilterObject]
  );

  const onClickFilter = () => {
    setDefaultValue(
      defaultValue.filter(
        (entry) => entry.value === selected.properties.common_name
      )
    );
    setTreeFilterObject(
      selected
        ? { ...treeFilterObject, trees: [selected.properties.common_name] } // only replace the trees object
        : { ...treeFilterObject, trees: [] }
    );
  };

  const onClickZoom = () => {
    mapRef.current?.getMap().easeTo({
        zoom: 14.5,
        duration: 650
    })
    setTimeout(() => setViewState({ ...viewState, zoom: 14.5 }), 650);

  };

  var selection = "";
  var featuresSelection: any[] = [];
  if (selected && selected.layer.id == "boundaries") {
    selection = selected.properties.name;
  } else if (selected && selected.layer.id == TREE_LAYER_NAME) {
    selection = selected.properties.tree_id;
  } else if (selected && selected.layer.id == "userphotos-data") {
    const center = selected.geometry.coordinates;
    const radius = 200;
    const options: { units: Units } = { units: "meters" };
    const circ = circle(center, radius, options);
    // @ts-ignore
    featuresSelection = pointsWithinPolygon(userPhotoList, circ).features;
  }

  // memoized filters
  const boundaryHighlightFilter = useMemo(
    () => ["==", ["get", "name"], selection],
    [selection]
  );
  const treeHighlightFilter = useMemo(
    () => ["==", ["get", "tree_id"], selection],
    [selection]
  );
  const treeFilter = useMemo(
    () => treeFilterCompositor(treeFilterObject, selected),
    [treeFilterObject]
  );
  const userPhotoHighlightFilter = useMemo(
    () => [
      "in",
      ["get", "public_id"],
      ["literal", featuresSelection.map((point) => point.properties.public_id)],
    ],
    [featuresSelection]
  );

  const onLoad = () => {
    mapRef.current?.getMap().moveLayer(TREE_LAYER_NAME, "boundaries-focus");
    setInteractiveLayers([LAYER_NAME, "boundaries", "userphotos-data"])
    setIsLoaded(true);
  };

  return (
    <>
      <Map
        ref={mapRef}
        initialViewState={viewState}
        mapStyle={style}
        style={{ width: "100vw", height: "100vh" }}
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={interactiveLayers}
        onMouseMove={onHover}
        onClick={onSelectZoom}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        cursor={cursor}
        onLoad={onLoad}
        // https://visgl.github.io/react-map-gl/docs/get-started/state-management
        onMove={(event: any) => setViewState(event.viewState)}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={BOUNDS}
        pitchWithRotate={false}
        dragRotate={false}
      >

        {userInputPosVisible &&
            <>
                <LocationDialog />
                <LocationSelectSenderButton marker={marker} handleClick={() => console.log("Not implemented.")}/>
                <LocationSelectMarker marker={marker} onMarkerDrag={onMarkerDrag}/>
            </>
        }
        <GeocoderControl
          mapboxAccessToken={MAPBOX_TOKEN}
          position="top-right"
          countries="CA"
          placeholder="SearchAddress"
          proximity={GEOCODER_PROXIMITY}
          marker={false}
        />
        {/* @ts-ignore */}
        <Source type="geojson" data={boundaries}>
          {/* @ts-ignore */}
          <Layer
            {...(filterValidForWideZoom(treeFilterObject)
              ? boundariesLayerWide
              : boundariesLayer)}
          />
          {/* @ts-ignore */}
          <Layer
            {...(filterValidForWideZoom(treeFilterObject)
              ? boundariesHighlightLayerWide
              : boundariesHighlightLayer)}
            filter={boundaryHighlightFilter}
          />
        </Source>
        {/* {userPhotos} */}
        {/* @ts-ignore */}
        <Source type="geojson" data={centroids}>
          {/* @ts-ignore */}
          <Layer
            {...(filterValidForWideZoom(treeFilterObject)
              ? centroidLayerWide
              : centroidLayer)}
          />
          {/* {userPhotos} */}
        </Source>
        {/* // https://github.com/mapbox/mapbox-gl-js/issues/9112 */}
        {/* @ts-ignore */}
        <Source type="geojson" data={userPhotoList}>
          <Layer {...userPhotoHeatmapLayer} />
          <Layer {...userPhotoCircleLayer} />
          <Layer {...userPhotoHighlights} filter={userPhotoHighlightFilter} />
        </Source>
        <Source type="vector" url={VAN_ALL_TREES_TILES}>
          {/* @ts-ignore */}
          <Layer
            {...(filterValidForWideZoom(treeFilterObject)
              ? treesLayerWide
              : treesLayer)}
            filter={treeFilter}
          />
          {/* @ts-ignore */}
          <Layer
            {...(filterValidForWideZoom(treeFilterObject)
              ? treesHighlightLayerWide
              : treesHighlightLayer)}
            filter={treeHighlightFilter}
          />
        </Source>
        {hoverInfo && hoverInfo.feature.layer.id == TREE_LAYER_NAME && (
          <ToolTip x={hoverInfo.x} y={hoverInfo.y}>
            <div>{titleCase(hoverInfo.feature.properties.common_name)}</div>
          </ToolTip>
        )}
        <GeolocateControl
          positionOptions={GEOLOCATE_POS_OPTIONS}
          fitBoundsOptions={{ maxZoom: isNarrow ? 17 : 15 }}
          trackUserLocation
          position="bottom-right"
        />
        <NavigationControl showCompass={false} position="bottom-right" />
        {/* <AttributionControl /> */}
        {featuresSelection[userPhotoId] && (
          <Marker
            key={`marker-${featuresSelection[userPhotoId].properties.public_id}`}
            latitude={featuresSelection[userPhotoId].geometry.coordinates[1]}
            longitude={featuresSelection[userPhotoId].geometry.coordinates[0]}
            anchor="bottom"
            style={{
              pointerEvents: "none",
            }}
          >
            <UserPhotoMarker
            //   size={featuresSelection[userPhotoId].properties.size}
              size={6}
              url={
                cloudinaryIdToCircleImage(featuresSelection[userPhotoId].properties.public_id)
              }
            />
          </Marker>
        )}
      </Map>
      <MapStyleToggle
        setStyle={setStyle}
        styles={[MAP_STYLE_CONTRAST, MAP_STYLE_PARKS, MAP_STYLE_SATELLITE]}
      />
      {/* Put these components inside MapGL to be available in fullscreen, but figure out class name assignment to avoid click-through to the map */}
      <InfoPanel
        //   @ts-ignore
        ref={infoPanelRef}
        title={title}
        isExpanded={isInfoPanelExpanded}
        handleToggle={handleToggleInfoPanel}
        color={
          selected && selected.layer.id == TREE_LAYER_NAME
            ? selected.properties.color
            : ""
        }
      >
        {!selected && stats.tree_stats && (
          <>
                <BoundaryStats
                    currentState={treeFilterObject}
                    updateParent={(props: any) => setTreeFilterObject({ ...props })}
                    heading="Citywide"
                    name="Vancouer"
                    stats={stats}
                    type="city"
                    description={WELCOME_MSG}
                />
                <a href=""></a>
          </>
        )}
        {selected && selected.layer.id == "boundaries" && (
          <BoundaryStats
            currentState={treeFilterObject}
            updateParent={(props: any) => setTreeFilterObject({ ...props })}
            {...selected.properties}
            heading="Neighborhood"
            stats={stats}
            type="neighborhood"
          />
        )}
        {selected && selected.layer.id == TREE_LAYER_NAME && (
          <InfoContainer {...selected.properties} stats={stats} blurbs={blurbs}>
            <FilterToTree
              onClick={onClickFilter}
              //   @ts-ignore
              style={{ "--color": selected.properties.color }}
            >
              View all <b>{titleCase(selected.properties.common_name)}</b> trees
              on the map
            </FilterToTree>
          </InfoContainer>
        )}
        {selected && selected.layer.id == "userphotos-data" && (
          <>
            <UserImageGrid
              //@ts-ignore
              className="photo-container"
              photoFeatures={featuresSelection}
              onClickDo={setUserPhotoId}
            />
          </>
        )}
        <ImageUploader handleUploadFile={UploadImageFile} handleNoPositionUpload={handleNoPositionUpload}/>
      </InfoPanel>
      <FilterPanel
        //   @ts-ignore
        currentFilterObject={treeFilterObject}
        className="filter-panel"
        updateParent={(props: any) => setTreeFilterObject({ ...props })}
        updateSelected={() => setFilterPanelSelected(true)}
        selected={selected} // so that clicking the map can also deselect the tree from the list
        //  @ts-ignore
        treeNamesAndColors={stats ? stats.tree_stats : null}
        defaultValue={defaultValue}
        setDefaultValue={(value: any) => setDefaultValue(value)}
        currentZoom={viewState.zoom}
        zoomIn={onClickZoom}
      />
    </>
  );
}

function cloudinaryIdToCircleImage(publicId: string): string {
    let base: string = "https://res.cloudinary.com"
    let circle_url: string = `${base}/${CLOUD_NAME}/image/upload/h_150,ar_1.0,c_fill,q_auto/r_max/${publicId}`
    return circle_url
}

export default MapComponent;
