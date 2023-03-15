import * as React from "react";
import Button from "@mui/material/Button"
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { SvgIconTypeMap } from "@mui/material/SvgIcon";
import { CameraAlt } from "@mui/icons-material";

interface UploaderProps {
    color: 'inherit'
        | 'primary'
        | 'secondary'
        | 'success'
        | 'error'
        | 'info'
        | 'warning';
    variant: 'contained'
        | 'outlined'
        | 'text';
    accept: string;
    startIcon: OverridableComponent<SvgIconTypeMap<{}, "svg">>;
    handleUpload: CallableFunction;
    displayText: string;
}

const UploaderButton: React.FC<UploaderProps> = (props) => {

    const hiddenInput = React.useRef<JSX.IntrinsicElements["input"]>(null);

    const handleClick = () => {
        hiddenInput.current?.click();
    };
    const handleChange = event => {
        const fileUploaded = event.target.files[0];
        props.handleUpload(fileUploaded);
    };

    return <>
        <Button
            variant={props.variant}
            color={props.color}
            startIcon={props.startIcon}
            onClick={handleClick}
        >
            {props.displayText}
        </Button>
        <input
            type="file"
            accept={props.accept}
            capture="environment"
            ref={hiddenInput}
            style={{display: 'none'}}
            onChange={handleChange}
        />
    </>

}