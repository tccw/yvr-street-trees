import styled, { keyframes } from "styled-components";
// @ts-ignore
import { Image, Transformation } from "cloudinary-react";
// @ts-ignore
import { CLOUD_NAME } from "../../env";
import { useState, useEffect } from "react";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: ${spin} 2s linear infinite;
  margin: auto;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

const ImageContainer = styled.section`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  margin: 3% 0;
  display: flex;
  flex-direction: column;
  background-color: #f0f0f0;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: white;
    transition: opacity 0.3s ease-in-out;
  }
`;

interface CloudinaryCustomImageType {
  cloudImageId: string;
  color?: string;
  additionalTransformations?: React.ReactElement[];
}

const CustomCloudinaryImage = (props: CloudinaryCustomImageType) => {
  const { cloudImageId, color } = props;
  const [loading, setLoading] = useState(true);

  // Reset loading state whenever the image ID changes.
  // This ensures the spinner appears on every new image, even when the
  // underlying <img> element is reused by React and the browser has the
  // image cached (in which case onLoad fires too fast to be seen without
  // this explicit reset).
  useEffect(() => {
    setLoading(true);
  }, [cloudImageId]);

  return (
    <ImageContainer>
      {loading && <Spinner />}
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
    </ImageContainer>
  );
};

export default CustomCloudinaryImage;
