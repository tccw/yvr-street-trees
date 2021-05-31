import * as React from 'react';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors';
import styled from 'styled-components';
// right: 100px;
const StyledFilterPanel = styled.div`
    position: absolute;
    bottom: 45px;
    right: 50px;
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

    @media (max-width: 500px) {
        right: 18%;
    }
    `;

const useStyles = makeStyles({
    controlLabel: {
        fontSize: '1rem'
    }
})

const GreenRadio = withStyles({
    root: {
      color: green[400],
      '&$checked': {
        color: green[600],
      },
    },
    checked: {},
  })((props) => <Radio color="default" {...props} />);


const MapStyleToggle = (props) => {
    const {setStyle, styles} = props;
    const classes = useStyles();

    const handleChange = (event) => {
        setStyle(event.target.value)
    }

    return (
        <StyledFilterPanel>
            <FormControl component='fieldset' >
                <RadioGroup row aria-label="mapstyle" name="style1" defaultValue={styles[0]} onChange={handleChange}>
                    <FormControlLabel value={styles[0]} control={<GreenRadio />} label="Parks" />
                    <FormControlLabel value={styles[1]} control={<GreenRadio />} label="Contrast" />
                    <FormControlLabel value={styles[2]} control={<GreenRadio />} label="Satellite" />
                </RadioGroup>
            </FormControl>
        </StyledFilterPanel>
    );
}

export default MapStyleToggle;