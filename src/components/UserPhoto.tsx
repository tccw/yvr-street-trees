import * as React from "react";
import styled from "styled-components";

interface PhotoMarkerProps {
  size: number;
  url: string;
}

const PhotoMarker = styled.div<PhotoMarkerProps>`
  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 0;
    border: 0.5rem solid transparent;
    border-top: 1rem solid #000000;
    border-bottom: 0;
    margin-left: -0.5rem;
    margin-bottom: -1rem;
  }
  width: ${(props) => `${props.size}rem`};
  height: ${(props) => `${props.size}rem`};
  background-image: ${(props) => `url(${props.url})`};
  background-size: 100%;
  background-color: black;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 50%;
  border: 0.15rem solid black;
  transform: ${(props) => `translate(0rem,${-(props.size / 5)}rem)`};
  pointer-events: none;
`;

function UserPhotoMarker(props: PhotoMarkerProps) {
  return (
    <PhotoMarker className="photo-marker" size={props.size} url={props.url} />
  );
}

export default UserPhotoMarker;
