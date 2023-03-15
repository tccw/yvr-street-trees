import { Marker, MarkerDragEvent } from "react-map-gl"
import SelfLocatePin from "./SelfLocatePin"

interface LocationSelectMarkerProps {
    marker: {
        latitude: number,
        longitude: number
    },
    onMarkerDrag: (e: MarkerDragEvent) => void
}

const LocationSelectMarker = (props: LocationSelectMarkerProps) => {
    const {marker, onMarkerDrag} = props;

    return (
        <Marker
          longitude={marker.longitude}
          latitude={marker.latitude}
          anchor="bottom"
          draggable
          onDrag={onMarkerDrag}
        >
          <SelfLocatePin size={50} />
        </Marker>
    )
}

export default LocationSelectMarker;