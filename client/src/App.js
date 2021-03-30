import React from 'react';
import {
  makeStyles,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab, Link, Checkbox, Typography, Grid, Box,
} from '@material-ui/core';
import { BugReport } from '@material-ui/icons';
import { useSnackbar } from 'notistack';
import { useScreenshot } from 'use-react-screenshot';
import publicIp from 'public-ip';
import ReCAPTCHA from 'react-google-recaptcha';

import * as api from './api';

const useStyles = makeStyles((theme) => ({
  container: {
    position: 'fixed',
    bottom: 0,
    right: 0,
    padding: theme.spacing(2),
  },
  dialog: {
    '& .MuiPaper-root': {
      minWidth: '500px',
    },
  },
  extendedIcon: {
    marginRight: theme.spacing(1),
  },
  actionButton: {
    color: 'white',
  },
  screenshot: {
    maxWidth: '550px',
  },
  checkbox: {
    marginLeft: '-9px',
  },
}));

export default function App() {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({});
  const { enqueueSnackbar } = useSnackbar();
  const [screenshot, takeScreenshot] = useScreenshot();
  const [sendScreenshot, setSendScreenshot] = React.useState(true);
  const [showCaptcha, setShowCaptcha] = React.useState(false);

  const successSnackbar = (url) => (
    <Link
      className={classes.actionButton}
      component={Button}
      href={url}
      target="_blank"
    >
      Open
    </Link>
  );

  const handleClickOpen = async () => {
    takeScreenshot(document.getElementsByTagName('body')[0]);
    setOpen(true);
  };

  const handleChange = (event) => {
    const element = event.target;
    setValues((previousValue) => ({ ...previousValue, [element.name]: element.value }));
  };

  const handleClose = () => {
    setOpen(false);
    setValues({});
  };

  const getDescription = async () => {
    let description = '';
    if (sendScreenshot) {
      description += `![screenshot](${screenshot})\n`;
    }
    //
    description += '\nSummary\n---\n';
    description += `${values.description}\n`;
    //
    description += '\nMetadata\n---\n';
    description += `**URL**: ${window.location.href}\n`;
    const ipAddress = await publicIp.v4();
    description += `**IP address**: ${ipAddress}\n`;
    description += `**User Agent**: ${navigator.userAgent}\n`;
    //
    return description;
  };

  const handleSubmit = async () => {
    const description = await getDescription();
    const githubIssueURL = await api.reportBug('foo', description);
    enqueueSnackbar(`GitHub issue filed at ${githubIssueURL}`, {
      action: successSnackbar(githubIssueURL),
    });
    handleClose();
  };

  return (
    <div className={classes.container}>
      <Fab
        color="primary"
        onClick={handleClickOpen}
        variant="extended"
      >
        <BugReport className={classes.extendedIcon} />
        Report a Bug
      </Fab>
      <Dialog
        className={classes.dialog}
        fullWidth
        onClose={handleClose}
        open={open}
      >
        <DialogTitle>Report a bug</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please describe the problem you are facing:
          </DialogContentText>
          <Box boxShadow={3}>
            <img
              alt="screenshot"
              className={classes.screenshot}
              src={screenshot}
            />
          </Box>
          <Grid
            alignItems="center"
            container
          >
            <Grid item>
              <Checkbox
                checked={sendScreenshot}
                className={classes.checkbox}
                color="primary"
                onChange={(e) => setSendScreenshot(e.target.checked)}
              />
            </Grid>
            <Grid item>
              <Typography color="textSecondary">Attach screenshot</Typography>
            </Grid>
          </Grid>
          {/* <CanvasDraw */}
          {/*  brushColor="red" */}
          {/*  brushRadius={1} */}
          {/*  imgSrc={screenshot} */}
          {/*  lazyRadius={0} */}
          {/* /> */}
          <TextField
            fullWidth
            label="Summary"
            margin="dense"
            multiline
            name="description"
            onChange={handleChange}
            rows={4}
            type="text"
            value={values.description || ''}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            onClick={handleClose}
          >
            Cancel
          </Button>
          {showCaptcha && (
            <ReCAPTCHA
              onChange={handleSubmit}
              sitekey={process.env.RECAPTCHA_KEY}
            />
          )}
          {!showCaptcha && (
            <Button
              color="primary"
              onClick={() => setShowCaptcha(true)}
            >
              Submit
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}
