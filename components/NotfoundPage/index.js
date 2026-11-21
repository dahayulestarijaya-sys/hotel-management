import React from 'react';
import { Button, Grid } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import './style.scss';

const NotfoundPage = () => (
  <Grid className="notfoundArea">
    <span className="notfoundArea__orb notfoundArea__orb--one" aria-hidden="true" />
    <span className="notfoundArea__orb notfoundArea__orb--two" aria-hidden="true" />

    <div className="notfoundArea__card">
      <span className="notfoundArea__icon">
        <Compass size={26} />
      </span>
      <h2>404</h2>
      <h3>This page has checked out</h3>
      <p>
        We could not find that page. It may have been moved, or the link is out of
        date.
      </p>
      <Button className="uiButton uiButton--primary" component={Link} to="/dashboard">
        Back to dashboard
      </Button>
    </div>
  </Grid>
);

export default NotfoundPage;
