import Fab from "@mui/material/Fab";
import Box from "@mui/material/Box";
import NavigationIcon from '@mui/icons-material/Navigation';
import CancelIcon from '@mui/icons-material/Cancel';
import { MakeUserPhotoFeature, UploadImageFile } from "../handlers/map-handlers";
import Grid from "@mui/material/Grid";
import { TreemapResponse, TreemapResponseError } from "../api-client/client";
import Alert from "@mui/material/Alert";

const DISP_ACCURACY = 4;

interface LocationSelectProps {
    marker: {
        latitude: number,
        longitude: number
    };
    onCompleteCallback: (response: TreemapResponse | TreemapResponseError) => void;
    onClickHide: () => void;
    onCancel: () => void;
    userFile: Blob | undefined;
}

const LocationSelectSenderButtons = (props: LocationSelectProps) => {
    const { marker, onCompleteCallback, userFile } = props;
    const handleOnClick = () => {
        const userEntry = MakeUserPhotoFeature(marker);
        if (userFile) {
            UploadImageFile(userEntry, userFile, onCompleteCallback);
        }
        props.onClickHide();
    }

    return (
        // <Grid container spacing={2}>
        <Box sx={{ '& > :not(style)': { m: 1 } }}
             style={{display: 'flex',
                    position: 'relative',
                    width: '100%',
                    'marginTop': '9rem',
                    'justifyContent': 'center',}}
                    // 'pointer-events': 'none'}} // breaks the button, figure out later
        >
            <Fab variant="extended" color="primary" aria-label="send" onClick={handleOnClick}>
                <NavigationIcon sx={{ mr: 1 }} />
                    Send Photo
                {/* {`(${marker.latitude.toFixed(DISP_ACCURACY)},
                  ${marker.longitude.toFixed(DISP_ACCURACY)})`} */}
            </Fab>
            <Fab variant="extended" color="error" aria-label="cancel" onClick={props.onCancel}>
                <CancelIcon sx={{ mr: 1 }} />
                    Cancel
            </Fab>
        </Box>
        // </Grid>
    )
}

export default LocationSelectSenderButtons;