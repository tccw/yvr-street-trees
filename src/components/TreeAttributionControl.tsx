import { AttributionControl } from "react-map-gl"

const currentYear: number = new Date().getFullYear();

const TreeAttributionControl = () => {
    return (
        <AttributionControl
            customAttribution={`Wiki CC BY-SA 3.0 | OGL 2.0 - Vancouver | © tccw 2020-${currentYear}`}
            style={{position: "relative", right: "100px", bottom: "-100px"}}
        />
    )
}

export default TreeAttributionControl;