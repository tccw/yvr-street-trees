import CustomCloudinaryImage from "../custom-cloudinary-image";
import { CenteredResponsiveContainer, FadedBackground, ImageBorder } from "./styles";
import { Transformation } from "cloudinary-react";


interface ImageLightboxProps {
    publicId: string | undefined;
    onClick?: () => void;
    setVisible?: () => void;
    setInvisible: () => void;
    isVisible: boolean
}

const ImageLightbox = (props: ImageLightboxProps) => {
    return (
        <>
            <FadedBackground visible={props.isVisible} onClick={props.setInvisible}/>
            <CenteredResponsiveContainer visible={props.isVisible} onClick={props.setInvisible}>
                <ImageBorder>
                    {props.publicId &&
                    <CustomCloudinaryImage
                        cloudImageId={props.publicId}
                        // additionalTransformations={[
                        //     <Transformation overlay={
                        //         {fontFamily: "Roboto Mono",
                        //         fontSize: 60,
                        //         fontWeight: "bold",
                        //         text: "2023-01-03",
                        //         }}
                        //         color="#f78102"
                        //     />,
                        //     <Transformation effect="outline:3" color="white" flags="layer_apply" gravity="south_east" y="10" x="10" />
                        // ]}
                    />
                    }

                </ImageBorder>
            </CenteredResponsiveContainer>
        </>
    )
}


export default ImageLightbox;
