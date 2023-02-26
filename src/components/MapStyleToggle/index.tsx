import * as React from "react";
import { MobileMapStyleToggle } from "../MapStyleToggleMobile";
// import Radio from '@material-ui/core/Radio';
// import RadioGroup from '@material-ui/core/RadioGroup';
// import FormControlLabel from '@material-ui/core/FormControlLabel';
// import FormControl from '@material-ui/core/FormControl';
// import { makeStyles, withStyles } from '@material-ui/core/styles';
// import { green } from '@material-ui/core/colors';
// import { Typography } from '@material-ui/core'
import styled from "styled-components";
// import { useWindowSize } from '../hooks/useWindowSize';
import { StyledFilterPanel } from "./styles";
import { useWindowSize } from "../../hooks/useWindowSize";
import {
  FormControl,
  FormControlLabel,
  makeStyles,
  Radio,
  RadioGroup,
  Typography,
  withStyles,
} from "@mui/material";
import { green } from "@mui/material/colors";

// const useStyles = makeStyles({
//     controlLabel: {
//         fontSize: '1rem',
//         '@media (max-width: 600px)' :{
//             fontSize: '0.7rem'
//         }
//     },
// })

// const GreenRadio = withStyles({
//     root: {
//       color: green[400],
//       '&$checked': {
//         color: green[600],
//       },
//       '@media (max-width: 320px)': {
//         "& .MuiSvgIcon-root": {
//             height: 15,
//             weight: 15,
//           },
//       }

//     },
//     checked: {},
//   })((props: JSX.IntrinsicAttributes) => <Radio color="default" {...props} />);

const MapStyleToggle = (props: { setStyle: any; styles: any }) => {
  const { setStyle, styles } = props;
  // const classes = useStyles();
  const isNarrow = useWindowSize(500); // window width in pixels

  const handleChange = (event: { target: { value: any } }) => {
    setStyle(event.target.value);
  };

  const mobileStylePanel = {
    bottom: "62px",
    right: "0",
    padding: "4px",
    marginRight: "50px",
  };

  return (
    <></>
    // <StyledFilterPanel style={isNarrow ? mobileStylePanel : {}}>
    //     { isNarrow
    //         ? ( <MobileMapStyleToggle styles={styles} setStyle={setStyle}/> )
    //         : (
    //             <FormControl component='fieldset' >
    //                 <RadioGroup row aria-label="mapstyle" name="style1" defaultValue={styles[0]} onChange={handleChange}>
    //                     <FormControlLabel value={styles[0]} control={<GreenRadio/>}
    //                     label={<Typography className={classes.controlLabel}>
    //                                 Contrast
    //                         </Typography>} />
    //                     <FormControlLabel value={styles[1]} control={<GreenRadio />}
    //                     label={<Typography className={classes.controlLabel}>
    //                                 Park
    //                         </Typography>} />
    //                     <FormControlLabel value={styles[2]} control={<GreenRadio />}
    //                     label={<Typography className={classes.controlLabel}>
    //                                 Satellite
    //                         </Typography>} />
    //                 </RadioGroup>
    //             </FormControl>
    //         )
    //     }
    // </StyledFilterPanel>
  );
};

export default MapStyleToggle;
