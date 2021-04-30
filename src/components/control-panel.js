import * as React from 'react';

function ControlPanel(props) {
  const {year} = props;

  return (
    <div className="control-panel">
      <h3>Vancouver Street Trees</h3>
      <p>
        Map showing street trees in Vancouver
      </p>
      <p>
        Data source: <a href="https://bit.ly/3aj8Hdb">Vancouver Open Data</a>
      </p>
      <div className="source-link">
        <a
          href="https://github.com/tccw/yvr-street-trees"
          target="_new"
        >
          View Code ↗
        </a>
      </div>
      <hr />

      <div key={'year'} className="input">
        <label>Year</label>
        <input
          type="range"
          value={year}
          min={1995}
          max={2015}
          step={1}
          onChange={evt => props.onChange(evt.target.value)}
        />
      </div>
    </div>
  );
}

export default React.memo(ControlPanel);
