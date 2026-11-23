import { AttributionControl } from "react-map-gl";
import { ACTIVE_CITY } from "../config/city-config";

const currentYear: number = new Date().getFullYear();

const TreeAttributionControl = () => {
    return (
        <AttributionControl
            customAttribution={`${ACTIVE_CITY.attribution} | © tccw 2020-${currentYear}`}
            style={{position: "relative", right: "100px", bottom: "-100px"}}
        />
    )
}

export default TreeAttributionControl;