import * as React from 'react';
import { MobileMapStyleToggle } from './map-style-toggle-mobile';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors';
import { Typography } from '@material-ui/core'
import styled from 'styled-components';
import { useWindowSize } from '../hooks/useWindowSize';

// right: 100px;
const StyledFilterPanel = styled.div`
    position: absolute;
    bottom: 70px;
    right: 45px;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    padding: 3px 6px;
    margin: 20px;
    line-height: 2;
    outline: none;
    width: -moz-fit-content;
    width: fit-content;
    max-width: 450px;
    height: -moz-fit-content;
    height: fit-content;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    @media (max-width: 600px) {
        right: none;
    }
    `;

const useStyles = makeStyles({
    controlLabel: {
        fontSize: '1rem',
        '@media (max-width: 600px)' :{
            fontSize: '0.7rem'
        }
    },
})

const GreenRadio = withStyles({
    root: {
      color: green[400],
      '&$checked': {
        color: green[600],
      },
      '@media (max-width: 320px)': {
        "& .MuiSvgIcon-root": {
            height: 15,
            weight: 15,
          },
      }

    },
    checked: {},
  })((props) => <Radio color="default" {...props} />);


const MapStyleToggle = (props) => {
    const {setStyle, styles} = props;
    const classes = useStyles();
    const isNarrow = useWindowSize(500); // window width in pixels

    const handleChange = (event) => {
        setStyle(event.target.value)
    }

    const mobileStylePanel = {
        'bottom': '62px',
        'right': '0',
        'padding': '4px',
        'marginRight': '50px',
    }

    return (
        <StyledFilterPanel style={isNarrow ? mobileStylePanel : {}}>
            { isNarrow
                ? ( <MobileMapStyleToggle styles={styles} setStyle={setStyle}/> )
                : (
                    <FormControl component='fieldset' >
                        <RadioGroup row aria-label="mapstyle" name="style1" defaultValue={styles[0]} onChange={handleChange}>
                            <FormControlLabel value={styles[0]} control={<GreenRadio/>}
                            label={<Typography className={classes.controlLabel}>
                                        Park
                                </Typography>} />
                            <FormControlLabel value={styles[1]} control={<GreenRadio />}
                            label={<Typography className={classes.controlLabel}>
                                        Contrast
                                </Typography>} />
                            <FormControlLabel value={styles[2]} control={<GreenRadio />}
                            label={<Typography className={classes.controlLabel}>
                                        Satellite
                                </Typography>} />
                        </RadioGroup>
                    </FormControl>
                )
            }
        </StyledFilterPanel>
    );
}

export default MapStyleToggle;