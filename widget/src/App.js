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
  Fab, Link
} from '@material-ui/core';
import { BugReport } from '@material-ui/icons';
import { useSnackbar } from "notistack";

import * as api from './api';

const useStyles = makeStyles(theme => ({
  container: {
    position: 'fixed',
    bottom: 0,
    right: 0,
    padding: theme.spacing(2)
  },
  dialog: {
    '& .MuiPaper-root': {
      minWidth: '500px',
    }
  },
  extendedIcon: {
    marginRight: theme.spacing(1)
  },
  actionButton: {
    color: 'white'
  }
}))

export default function App() {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({});
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const successSnackbar = (url) => (key) => {
    return (
      <Link component={Button} href={url} className={classes.actionButton} target="_blank">
        Open
      </Link>
    )
  }

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleChange = (event) => {
    setValues(previousValue => Object.assign({}, previousValue, {
      [event.target.name]: event.target.value
    }))
  }

  const handleClose = () => {
    setOpen(false);
    setValues({});
  };

  const handleSubmit = async () => {
    const githubIssueURL = await api.reportBug(values.title, values.description);
    enqueueSnackbar(`GitHub issue filed at ${githubIssueURL}`, {
      action: successSnackbar(githubIssueURL)
    })
    handleClose();
  };

  return (
    <div className={classes.container}>
      <Fab color="primary" variant="extended" onClick={handleClickOpen}>
        <BugReport className={classes.extendedIcon} />
        Report a Bug
      </Fab>
      <Dialog open={open} onClose={handleClose} className={classes.dialog}>
        <DialogTitle>Report a bug</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please describe your bug report in detail.
          </DialogContentText>
          <TextField
            margin="dense"
            label="Title"
            type="text"
            name="title"
            fullWidth
            variant='outlined'
            value={values.title || ''}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            name="description"
            variant="outlined"
            multiline
            rows={4}
            value={values.description || ''}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
