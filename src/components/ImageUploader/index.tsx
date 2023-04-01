import * as React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { UploadFile, CameraAlt } from "@mui/icons-material";
import UserPhotoFeature from "../../api-client/types";
import { point } from "@turf/turf";
import { MakeUserPhotoFeature } from "../../handlers/map-handlers";
import { TreemapResponse, TreemapResponseError } from "../../api-client/client";

interface ImageUploaderProps {
    handleUploadFile: CallableFunction,
    handleNoPositionUpload: CallableFunction,
    onCompleteCallback: (response: TreemapResponse | TreemapResponseError) => void
    // setFile: (event: any) => void
}

const ImageUploader: React.FC<ImageUploaderProps> = (props: ImageUploaderProps) => {

    const hiddenFileInput = React.useRef<JSX.IntrinsicElements["input"]>(null);
    const hiddenCameraInput = React.useRef<JSX.IntrinsicElements["input"]>(null);
    const [isDialogVisible, setIsDialogVisible] = React.useState<boolean>(false);


    const handleImageUploadClick = () => {
        hiddenFileInput.current?.click();
      };

    const handleFileChange = event => {
        const userFile = event.target.files[0];
        tryGetUserLocation()
            .then((result: GeolocationPosition) => {
                const userEntry: UserPhotoFeature = MakeUserPhotoFeature(
                    result.coords
                )
                props.handleUploadFile(userEntry, userFile, props.onCompleteCallback);
            }
            ).catch(error => {
                if (error instanceof(GeolocationPositionError))
                    props.handleNoPositionUpload(userFile);

                console.log(error);
            }
        );
    };

    return (
        <Stack direction="row" spacing={2} justifyContent="center">
            <Button
                variant="contained"
                color="success"
                startIcon={<CameraAlt/>}
                onClick={handleImageUploadClick}
                style={{'marginBottom': '3rem'}}
            >
                Add Photo
            </Button >
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
