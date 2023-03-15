import Fab from "@mui/material/Fab";
import Box from "@mui/material/Box";
import NavigationIcon from '@mui/icons-material/Navigation';
import { MakeUserPhotoFeature, UploadImageFile } from "../handlers/map-handlers";
import Grid from "@mui/material/Grid";

const DISP_ACCURACY = 4;

interface LocationSelectProps {
    marker: {
        latitude: number,
        longitude: number
    },
    handleClick: CallableFunction
}

const LocationSelectSenderButton = (props: LocationSelectProps) => {
    const { marker } = props;
    const handleOnClick = () => {
        const userEntry = MakeUserPhotoFeature(marker.latitude, marker.longitude);
        // UploadImageFile()
    }

    return (
        // <Grid container spacing={2}>
        <Box sx={{ '& > :not(style)': { m: 15 } }}
             style={{display: 'flex',
                    position: 'fixed',
                    width: '100%',
                    'justify-content': 'center',
                    'pointer-events': 'none'}} // breaks the button, figure out later
        >
            <Fab variant="extended" color="primary" aria-label="add" onClick={() => alert("Clicky!")}>
                <NavigationIcon sx={{ mr: 1 }} />
                {`(${marker.latitude.toFixed(DISP_ACCURACY)},
                  ${marker.longitude.toFixed(DISP_ACCURACY)})`}
            </Fab>
        </Box>
        // </Grid>
    )
}

export default LocationSelectSenderButton;