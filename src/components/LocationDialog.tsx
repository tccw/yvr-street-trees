import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import { DialogContentText } from '@mui/material';


export interface LocationDialogProps {
  onUserLocation: () => void;
  onManualLocation: () => void;
  isOpen: boolean;
}

export default function LocationDialog(props: LocationDialogProps) {

  return (
    <Dialog
        open={props.isOpen}
        onClose={() => console.log("Boom, baby!")}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Use your current location?"}
        </DialogTitle>
        <DialogActions>
          <Button onClick={props.onUserLocation} variant="outlined">My Location</Button>
          <Button onClick={props.onManualLocation} autoFocus>Set Manually</Button>
          {/* <Button onClick={handleClose}>Always use my location</Button> */}
        </DialogActions>
      </Dialog>
  );
}