import styled, { keyframes } from "styled-components";
// @ts-ignore
import { Image, Transformation } from "cloudinary-react";
// @ts-ignore
import { CLOUD_NAME } from "../../env";
import { useState, useEffect } from "react";
import { isDirectImageUrl } from "../data/dev-mock-user-photos";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div<{ $light?: boolean }>`
  border: 3px solid ${(props) => (props.$light ? "rgba(255, 255, 255, 0.2)" : "#f3f3f3")};
  border-top: 3px solid ${(props) => (props.$light ? "#ffffff" : "#3498db")};
  border-radius: 50%;
  width: 32px;
  height: 32px;
  animation: ${spin} 0.9s linear infinite;
  margin: auto;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

const ImageContainer = styled.section<{ fillContainer?: boolean }>`
  position: relative;
  width: 100%;
  height: ${(props) => (props.fillContainer ? "100%" : "auto")};
  aspect-ratio: ${(props) => (props.fillContainer ? "auto" : "4 / 3")};
  margin: ${(props) => (props.fillContainer ? "0" : "3% 0")};
  display: flex;
  flex-direction: ${(props) => (props.fillContainer ? "row" : "column")};
  align-items: ${(props) => (props.fillContainer ? "center" : "stretch")};
  justify-content: ${(props) => (props.fillContainer ? "center" : "flex-start")};
  background-color: ${(props) => (props.fillContainer ? "transparent" : "#f0f0f0")};
  overflow: ${(props) => (props.fillContainer ? "visible" : "hidden")};
  pointer-events: ${(props) => (props.fillContainer ? "none" : "auto")};
  img {
    width: ${(props) => (props.fillContainer ? "auto" : "100%")};
    height: ${(props) => (props.fillContainer ? "auto" : "100%")};
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    background: ${(props) => (props.fillContainer ? "transparent" : "white")};
    border-radius: ${(props) => (props.fillContainer ? "8px" : "0")};
    box-shadow: ${(props) =>
      props.fillContainer ? "0 16px 40px rgba(0, 0, 0, 0.55)" : "none"};
    pointer-events: auto;
    user-select: none;
    -webkit-user-drag: none;
    transition: opacity 0.25s ease-in-out;
  }
`;

interface CloudinaryCustomImageType {
  cloudImageId: string;
  color?: string;
  additionalTransformations?: React.ReactElement[];
  fillContainer?: boolean;
}

const CustomCloudinaryImage = (props: CloudinaryCustomImageType) => {
  const { cloudImageId, color, fillContainer } = props;
  const [loading, setLoading] = useState(true);

  // Reset loading state whenever the image ID changes.
  // This ensures the spinner appears on every new image, even when the
  // underlying <img> element is reused by React and the browser has the
  // image cached (in which case onLoad fires too fast to be seen without
  // this explicit reset).
  useEffect(() => {
    setLoading(true);
  }, [cloudImageId]);

  const isDirectUrl = isDirectImageUrl(cloudImageId);

  return (
    <ImageContainer fillContainer={fillContainer}>
      {loading && <Spinner $light={fillContainer} />}
      {isDirectUrl ? (
        <img
          src={cloudImageId}
          alt="User tree photo"
          ref={(el) => {
            if (el?.complete) setLoading(false);
          }}
          onLoad={() => setLoading(false)}
          style={{ opacity: loading ? 0 : 1 }}
        />
      ) : (
        <Image
          cloudName={CLOUD_NAME}
          publicId={cloudImageId}
          defaultImage={'yvr-street-trees:no-image-yet-leaf.png'}
          alt={`Image of a ${cloudImageId.split("/")[1]} leaf`}
          onLoad={() => setLoading(false)}
          style={{ opacity: loading ? 0 : 1 }}
        >
          {color
            ? (
              <Transformation
                fetchFormat="webp"
                quality="auto"
                border={`4px_solid_rgb:${color.split("#")[1]}`}
              />
            )
            : (
              <Transformation
                fetchFormat="webp"
                quality="auto"
              />
            )
          }
          {props.additionalTransformations}
        </Image>
      )}
    </ImageContainer>
  );
};

export default CustomCloudinaryImage;
