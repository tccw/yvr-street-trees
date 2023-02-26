import { CircleLayer } from "react-map-gl";
import styled from "styled-components";

interface ToolTipProps {
  x: number;
  y: number;
}

const ToolTip = styled.div.attrs((props: ToolTipProps) => ({
  style: {
    left: props.x + "px",
    top: props.y + "px",
  },
}))<ToolTipProps>`
  font-size: 1;
  position: absolute;
  /* desktops and devices with fine pointer res and can hover */
  @media (hover: hover) and (pointer: fine) {
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
  }
  /* mobile devices which cannot hover and have coarse pointer res */
  @media (hover: none) and (pointer: coarse) {
    display: none;
  }
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

const LAYER_NAME = "records";
const layerStyle: CircleLayer = {
  id: LAYER_NAME,
  type: "circle",
  paint: {
    "circle-radius": 7,
    "circle-color": [
      "match",
      ["get", "type"],
      "Sample",
      "#648FFF",
      "Sighting",
      "#785EF0",
      /* other */ "#504646",
    ],
    "circle-stroke-width": 1,
    "circle-opacity": 0.9,
  },
};

const highlightStyle: CircleLayer = {
  id: `${LAYER_NAME}-focus`,
  type: "circle",
  source: LAYER_NAME,
  paint: {
    "circle-radius": 10,
    "circle-color": "#FFB000",
    "circle-stroke-color": "#DC267F",
    "circle-stroke-width": 2,
    "circle-opacity": 1,
  },
};

export { ToolTip, layerStyle, highlightStyle, FilterToTree };
