import * as React from "react";
import styled from "styled-components";
import ParkMapIcon from "../../public/parkmap.svg";
import ContrastMapIcon from "../../public/contrastmap.svg";
import SatelliteMapIcon from "../../public/satellitemap.svg";
import MapLayersIcon from "../../public/layers.svg";
import { useComponentVisible } from "../../hooks/useOutsideClick";
import { MapFigure, MapLayerIcon, MapStyleGrid } from "./styles";

export const MobileMapStyleToggle = (props: any) => {
  const { setStyle, styles } = props;
  const [mapList, setMapList] = React.useState<JSX.Element[]>([]);

  const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible(false);

  const handleClick = () => {
    setIsComponentVisible(true);
  };

  const handleClickMap = (event: any) => {
    setStyle(event.target.value);
  };

  const iconMap = {
    parks: { icon: ParkMapIcon, url: styles[1] },
    contrast: { icon: ContrastMapIcon, url: styles[0] },
    satellite: { icon: SatelliteMapIcon, url: styles[2] },
  };

  React.useEffect(() => {
    let items = [];
    for (const [key, value] of Object.entries(iconMap)) {
      items.push(
        //@ts-ignore
        <li
          style={{ listStyleType: "none", margin: "6px 0 6px 0" }}
          key={key}
          //@ts-ignore
          name={key}
        >
          <MapFigure>
            <MapLayerIcon
              type="image"
              src={value.icon}
              margin="3px 6px"
              //@ts-ignore
              size="70px"
              ariaLabel={`${key}-style`}
              value={value.url}
              onClick={handleClickMap}
            />
            <figcaption style={{ marginTop: "-5px", fontWeight: "500" }}>
              {key}
            </figcaption>
          </MapFigure>
        </li>
      );
    }

    setMapList(items);
  }, []);

  return (
    <>
      {isComponentVisible ? (
        <MapStyleGrid ref={ref}>{mapList}</MapStyleGrid>
      ) : (
        <MapLayerIcon
          type="image"
          //@ts-ignore
          size="25px"
          onClick={handleClick}
          src={MapLayersIcon}
          ariaLabel="map-style-layers"
        />
      )}
    </>
  );
};
