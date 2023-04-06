import * as React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { CameraAlt } from "@mui/icons-material";
import HideUserPhotosCheckbox from "../HideUserPhotosCheckbox";

interface ImageUploaderProps {
    setFile: (file: Blob) => void
    toggleImageHeatmap: () => void
}

const ImageUploader: React.FC<ImageUploaderProps> = (props: ImageUploaderProps) => {

    const hiddenFileInput = React.useRef<JSX.IntrinsicElements["input"]>(null);
    const hiddenCameraInput = React.useRef<JSX.IntrinsicElements["input"]>(null);
    const [isDialogVisible, setIsDialogVisible] = React.useState<boolean>(false);


    const handleImageUploadClick = () => {
        hiddenFileInput.current?.click();
      };

    const handleFileChange = (event) => {
        const userFile = event.target.files[0];
        if (userFile)
            props.setFile(userFile);
    }

    return (
        <Stack direction="row"
               spacing={2}
               justifyContent="center"
               alignItems="center"
               style={{'marginBottom': '3rem'}}
        >
            <Button
                variant="contained"
                color="success"
                startIcon={<CameraAlt/>}
                onClick={handleImageUploadClick}
            >
                Add Photo
            </Button >
            <HideUserPhotosCheckbox onChange={props.toggleImageHeatmap}/>
            <input
                hidden
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


export default ImageUploader;
