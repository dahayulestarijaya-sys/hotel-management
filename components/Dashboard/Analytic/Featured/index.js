import React, { Fragment } from 'react';
import { Grid } from '@material-ui/core';
import './style.scss';

/**
 * Row of KPI cards. `items` is a list of
 * `{ key, name, value, icon, hint, tone }` objects so the dashboard can feed it
 * live booking metrics plus a lucide icon, a small caption and an accent tone.
 */
const AnalyticFeatured = ({ items = [] }) => (
  <Fragment>
    {items.map(item => {
      const Icon = item.icon;
      const toneClass = item.tone ? ` analyticFeaturedWrap--${item.tone}` : '';

      return (
        <Grid item lg={3} sm={6} xs={6} key={item.key}>
          <Grid className={`analyticFeaturedWrap${toneClass}`}>
            <span className="analyticFeaturedGlow" aria-hidden="true" />
            <Grid className="analyticFeaturedContent">
              <p>{item.name}</p>
              <h3>{item.value}</h3>
              {item.hint && <span className="analyticFeaturedHint">{item.hint}</span>}
            </Grid>
            {Icon && (
              <span className="analyticFeaturedIcon">
                <Icon size={20} />
              </span>
            )}
          </Grid>
        </Grid>
      );
    })}
  </Fragment>
);

export default AnalyticFeatured;
