import * as React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { UploadFile, CameraAlt } from "@mui/icons-material";
import UserPhotoFeature from "../../api-client/types";
import { point } from "@turf/turf";
import { MakeUserPhotoFeature } from "../../handlers/map-handlers";

interface ImageUploaderProps {
    handleUploadFile: CallableFunction,
    handleNoPositionUpload: CallableFunction
}

const ImageUploader: React.FC<ImageUploaderProps> = (props: ImageUploaderProps) => {

    const hiddenFileInput = React.useRef<JSX.IntrinsicElements["input"]>(null);
    const hiddenCameraInput = React.useRef<JSX.IntrinsicElements["input"]>(null);
    const [isDialogVisible, setIsDialogVisible] = React.useState<boolean>(false);


    const handleImageUploadClick = () => {
        hiddenFileInput.current?.click();
      };

    const handleCameraUploadClick = () => {
        hiddenCameraInput.current?.click();
    };

    const handleFileChange = event => {
        const userFile = event.target.files[0];
        let coordinates: Array<number>;
        tryGetUserLocation()
            .then((result: GeolocationPosition) => {
                // coordinates = [result.coords.longitude, result.coords.latitude]
                // const userEntry: UserPhotoFeature = point(coordinates);
                const userEntry: UserPhotoFeature = MakeUserPhotoFeature(
                    result.coords.latitude,
                    result.coords.longitude
                )
                props.handleUploadFile(userEntry, userFile);
            }
            ).catch(error => {
                if (error instanceof(GeolocationPositionError))
                    props.handleNoPositionUpload(userFile);

                console.log(error);
            });

        // const coordinates = [-123.153057, 49.240019]; // [long, lat] order
        // const userEntry: UserPhotoFeature = point(coordinates);

        // props.handleUploadFile(userEntry, fileUploaded);
    };

    return (
        <Stack direction="row" spacing={2} justifyContent="center">
            <Button
                variant="contained"
                color="success"
                startIcon={<CameraAlt/>}
                onClick={handleImageUploadClick}
            >
                Add Photo
            </Button>
            <input
                type="file"
                accept="image/*"
                // capture="environment"
                ref={hiddenFileInput}
                style={{display: 'none'}}
                onChange={handleFileChange}
            />
        </Stack>
    )
}

function tryGetUserLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

export default ImageUploader;
