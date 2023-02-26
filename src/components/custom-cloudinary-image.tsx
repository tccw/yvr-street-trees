import styled from "styled-components";
// import {
//   AdvancedImage,
//   accessibility,
//   responsive,
//   lazyload,
//   placeholder,
// } from "@cloudinary/react";
// import { Cloudinary } from "@cloudinary/url-gen";
import { Image, Transformation } from "cloudinary-react";
import { CLOUD_NAME } from "../../env";

const NoTreeImage = styled.img`
  width: 100px;
  margin: 5% 35% 5% 35%;
`;

const ImageContainer = styled.section`
  position: relative;
  width: inheret;
  margin: 3%;
  display: flex;
  flex-direction: column;
`;

// const ImageContainer = styled.section`
// display: flex;
//   width: 50%;
//   height: 50%;
//   margin: 3%;
// `;

interface CloudinaryCustomImageType {
  cloudImageId: string;
  color?: string;
}


const CustCloudinaryImage = (props: CloudinaryCustomImageType) => {
  const { cloudImageId, color } = props;

//   let publicId = cloudinaryImageName(genusName, speciesName);
    // const cld = new Cloudinary({
    //   cloud: {
    //     cloudName: CLOUD_NAME,
    //   },
    // });
  //   let img = cld.image(publicId);

  //   return VALID_IMAGE_LIST.has(publicId.split("/")[1]) ? (
  //     <ImageContainer>
  //       <AdvancedImage
  //         cldImg={img}
  //         plugins={[lazyload(), responsive(), accessibility(), placeholder()]}
  //       />
  //     </ImageContainer>
  //   ) : (
  //     <NoTreeImage src={FALLBACK_IMAGE} />
  //   );

//   let cloudinary_url = Cloudinary.utils.cloudinary_url(cloudImageId, {});
//   console.log(cloudinary_url);

    return (
        <ImageContainer>
            <Image
                cloudName={CLOUD_NAME}
                publicId={cloudImageId}
                defaultImage={'yvr-street-trees:no_image_leaf.png'}
            >
                {color
                    ? (<Transformation
                            fetchFormat="auto"
                            quality="auto"
                            border={`4px_solid_rgb:${color.split("#")[1]}`}
                    />)
                    : (
                        <Transformation
                            fetchFormat="auto"
                            quality="auto"
                            />
                    )
                }
            </Image>
        </ImageContainer>
    )

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

export default CustCloudinaryImage;
