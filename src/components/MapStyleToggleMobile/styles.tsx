import styled from "styled-components";

interface IconProps {
  size: string;
  margin?: string;
}

const MapLayerIcon = styled.input<IconProps>`
  vertical-align: middle;
  outline-color: none;
  width: ${(props) => props.size};
  height: ${(props) => props.size};
  margin: ${(props) => (props.margin ? props.margin : "0")};
`;

const MapStyleGrid = styled.div`
  display: grid;
  grid-template-areas: "parks contrast satellite";
`;

const MapFigure = styled.figure`
  text-align: center;
  margin: 0;
  text-transform: capitalize;
  font-size: 0.8rem;
`;

export { MapLayerIcon, MapStyleGrid, MapFigure };
