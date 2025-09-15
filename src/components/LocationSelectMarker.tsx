import SelfLocatePin from "./SelfLocatePin"
import styled from "styled-components"

const CenterPinOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -100%);
  pointer-events: none;
  z-index: 1000;
`;

const LocationSelectMarker = () => {
    return (
        <CenterPinOverlay>
          <SelfLocatePin size={50} />
        </CenterPinOverlay>
    )
}

export default LocationSelectMarker;
