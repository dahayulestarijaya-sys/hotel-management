import React from 'react';
import { CircleSlider } from 'react-circle-slider';
import { Grid } from '@material-ui/core';

import './style.scss';

const ReactCircleSlider = ({ percentage, clicks, label, circleColor, progressColor }) => (
    <Grid className="reactCircleSlider">
        <CircleSlider
            value={Number(percentage) || 0}
            size={100}
            knobRadius={0}
            progressWidth={10}
            circleWidth={10}
            tooltipSize={20}
            progressColor={progressColor}
            circleColor={circleColor}
            tooltipColor="#111026"
            showTooltip={true}
            showPercentage={true}
            disabled={true}
        />
        <div className="rcsText">
            <h4>{clicks}</h4>
            {label && <p>{label}</p>}
        </div>
    </Grid>
);

export default ReactCircleSlider;
