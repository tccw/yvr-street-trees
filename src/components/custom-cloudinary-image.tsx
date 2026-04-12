import styled from "styled-components";
// @ts-ignore
import { Image, Transformation } from "cloudinary-react";
// @ts-ignore
import { CLOUD_NAME } from "../../env";

const NoTreeImage = styled.img`
  width: 100px;
  margin: 5% 35% 5% 35%;
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
  }
`;

interface CloudinaryCustomImageType {
  cloudImageId: string;
  color?: string;
  additionalTransformations?: React.ReactElement[]
}

const CustomCloudinaryImage = (props: CloudinaryCustomImageType) => {
  const { cloudImageId, color } = props;

  return (
    <ImageContainer>
      <Image
        cloudName={CLOUD_NAME}
        publicId={cloudImageId}
        defaultImage={'yvr-street-trees:no-image-yet-leaf.png'}
        alt={`Image of a ${cloudImageId.split("/")[1]} leaf`}
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

//   return VALID_IMAGE_LIST.has(cloudImageId.split("/")[1]) ? (
//     <ImageContainer>
//       <Image
//         cloudName={CLOUD_NAME}
//         publicId={cloudImageId}
//       >
//         {color
//             ? (<Transformation
//                     fetchFormat="auto"
//                     quality="auto"
//                     border={`4px_solid_rgb:${color.split("#")[1]}`}
//               />)
//             : (
//                 <Transformation
//                     fetchFormat="auto"
//                     quality="auto"
//                     />
//             )
//         }
//       </Image>
//     </ImageContainer>
//   ) : (
//     <NoTreeImage src={FALLBACK_IMAGE} />
//   );
};

export default CustomCloudinaryImage;
