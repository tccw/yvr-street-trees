import { Image, Transformation } from "cloudinary-react";
import * as React from "react";
import { CLOUD_NAME } from "../../../env";
import CustCloudinaryImage from "../custom-cloudinary-image";
import { CentralImage, FadedBackground } from "./styles";

const ImageLightbox = () => {
    return (
        <FadedBackground>
            <CustCloudinaryImage cloudImageId="yvr-user-photos/49.262825-123.20135"/>
        </FadedBackground>
        // <CentralImage>
        // <Image
        //     cloudName={CLOUD_NAME}
        //     publicId="yvr-user-photos/49.2635583-123.2041611"
        //     // style={{
        //     //     maxWidth: "100%",
        //     //     maxHeight: "100%",
        //     //     display: "block",
        //     //     margin: "auto auto",
        //     // }}
        // >
        //     <Transformation
        //     fetchFormat="auto"
        //     quality="auto"
        //     />
        // </Image>
        // </CentralImage>

    )
}


export default ImageLightbox;
