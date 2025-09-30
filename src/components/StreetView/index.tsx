import React from "react";
import { StreetViewContainer } from "./styles";
import { REACT_APP_GOOGLE_MAPS_API_KEY } from "../../../env";

interface StreetViewProps {
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
  fov?: number;
  isPanelExpanded: boolean; // watch panel expansion
}

const StreetView: React.FC<StreetViewProps> = ({
  lat,
  lng,
  heading = 0,
  pitch = 0,
  fov = 90,
  isPanelExpanded,
}) => {
  // Don't render if panel is not expanded or API key is missing
  if (!isPanelExpanded || !REACT_APP_GOOGLE_MAPS_API_KEY) {
    return <StreetViewContainer />;
  }

  // Construct the Google Maps Embed API URL for streetview mode
  const streetViewUrl = new URL("https://www.google.com/maps/embed/v1/streetview");
  streetViewUrl.searchParams.set("key", REACT_APP_GOOGLE_MAPS_API_KEY);
  streetViewUrl.searchParams.set("location", `${lat},${lng}`);
  streetViewUrl.searchParams.set("heading", heading.toString());
  streetViewUrl.searchParams.set("pitch", pitch.toString());
  streetViewUrl.searchParams.set("fov", fov.toString());

  return (
    <StreetViewContainer>
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        referrerPolicy="no-referrer-when-downgrade"
        src={streetViewUrl.toString()}
        loading="lazy"
        title={`Street View at ${lat}, ${lng}`}
      />
    </StreetViewContainer>
  );
};

export default StreetView;
