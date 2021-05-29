import * as React from 'react';
import { lighten, makeStyles, withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';


const useStyles = makeStyles((theme) => ({
    root: {
      width: 300 + theme.spacing(3) * 2,
    },
    margin: {
      height: theme.spacing(3),
    },
  }));

// slightly modified Pretto styling from Material UI example
const PrettoSlider = withStyles({
    root: {
      color: '#52af77',
      height: 8,
    },
    thumb: {
      height: 24,
      width: 24,
      backgroundColor: '#fff',
      border: '2px solid currentColor',
      marginTop: -8,
      marginLeft: -12,
      '&:focus, &:hover, &$active': {
        boxShadow: 'inherit',
      },
    },
    active: {},
    valueLabel: {
      left: 'calc(-50% + 4px)',
    },
    track: {
      height: 8,
      borderRadius: 4,
    },
    rail: {
      height: 8,
      borderRadius: 4,
    },
    mark: {
        backgroundColor: lighten('#52af77', 0.55),
        height: 14,
        width: 14,
        borderRadius: '50%',
        marginTop: -3,
        marginLeft:-7
      },
      markActive: {
        opacity: 1,
        backgroundColor: 'currentColor',
      },
  })(Slider);

// format the aria label for accessibility/screen readers
function valuetext(value, unit) {
  return `${value} ${unit}`;
}

export default function RangeSlider({step, min_val, max_val, slider_title, curr_range, updateRange, unit}) {
  const classes = useStyles();

  // update the parent state
  const handleChange = (event, newValue) => {
    updateRange(newValue);
  };

  const formatLabel = (value, index) => {
      if (value < max_val) {
        return value;
      } else {
          return `${max_val}+`;
      }
  };

  const generateMarks = () => {
    let marks = [];
    let arr = Array(Math.round((max_val - min_val) / step)).fill(0).map((_, i) => (i + 1) * step);
    arr.pop();
    arr.forEach((elem) => {
        marks.push({value: elem});
    });
    return marks;
};

  return ( 
    <div className={classes.root}>
      <Typography id="pretto slider" style={{'fontWeight': 'bold'}} gutterBottom>
          {slider_title}
      </Typography>
      <PrettoSlider
        value={curr_range}
        min={min_val}
        max={max_val}
        step={step}
        marks={generateMarks()}
        onChange={handleChange}
        valueLabelDisplay="auto"
        valueLabelFormat={formatLabel}
        aria-labelledby="pretto slider"
        getAriaValueText={valuetext}
      />
    </div>
  );
}