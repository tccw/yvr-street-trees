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

function valuetext(value) {
  return `${value} ft`;
}

export default function RangeSlider({step, min_val, max_val, slider_title, curr_range, updateRange}) {
  const classes = useStyles();
//   const [value, setValue] = React.useState(initial_range);

  const handleChange = (event, newValue) => {
    updateRange(newValue);
  };

  const formatLabelHeight = (value, index) => {
      if (value <= 100) {
        return value;
      } else {
          return '100+';
      }
  };

  const formatLabelDiameter = (value, index) => {
    if (value <= 42) {
      return value;
    } else {
        return '42+';
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

  return ( step ?
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
        valueLabelFormat={formatLabelHeight}
        aria-labelledby="pretto slider"
        getAriaValueText={valuetext}
      />
    </div>
    : 
    <div className={classes.root}>
        <Typography id="pretto slider" style={{'fontWeight': 'bold'}} gutterBottom>
            {slider_title}
        </Typography>
        <PrettoSlider
        value={curr_range}
        min={min_val}
        max={max_val}
        onChange={handleChange}
        valueLabelDisplay="auto"
        valueLabelFormat={formatLabelDiameter}
        aria-labelledby="pretto slider"
        getAriaValueText={valuetext}
    />
    </div>
  );
}