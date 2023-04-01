import * as React from 'react';
import Alert, { AlertColor } from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { Box, Fade } from '@mui/material';
import { AlertDetailsProps } from '../types/component_types';
import { ConstructionOutlined } from '@mui/icons-material';


export default function AlertBox(props: AlertDetailsProps) {
    const {isAlertVisible, alertMessage, alertSeverity} = props;
  return (
    <Box sx={{ '& > :not(style)': { m: 15 } }}
    style={{display: 'flex',
           position: 'fixed',
           width: '100%',
           'justifyContent': 'center',
           'pointerEvents': 'none',
           'zIndex': '10000' // TODO: why do you do this to yourself?
        }}
    >
        <Fade in={isAlertVisible} timeout={{enter: 100, exit: 2000}}>
            <Alert severity={alertSeverity}>{alertMessage}</Alert>
        </Fade>
    </Box>
  );
}