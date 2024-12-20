import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import PropTypes from 'prop-types';

/**
 */
export function WindowList({
  container = null, handleClose, windowIds, focusWindow, focusedWindowId = null,
  t = key => key, titles = {}, tReady = false, ...menuProps
}) {
  return (
    <Menu
      anchorOrigin={{
        horizontal: 'right',
        vertical: 'top',
      }}
      transformOrigin={{
        horizontal: 'left',
        vertical: 'top',
      }}
      id="window-list-menu"
      container={container?.current}
      onClose={handleClose}
      {...menuProps}
    >
      <ListSubheader role="presentation" selected={false} disabled tabIndex="-1">
        {t('openWindows')}
      </ListSubheader>
      {
        windowIds.map((windowId, i) => (
          <MenuItem
            key={windowId}
            selected={windowId === focusedWindowId}
            onClick={(e) => { focusWindow(windowId, true); handleClose(e); }}
          >
            <ListItemText primaryTypographyProps={{ variant: 'body1' }}>
              {
                titles[windowId] || t('untitled')
              }
            </ListItemText>
          </MenuItem>
        ))
      }
    </Menu>
  );
}

WindowList.propTypes = {
  container: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  focusedWindowId: PropTypes.string,
  focusWindow: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  t: PropTypes.func,
  titles: PropTypes.objectOf(PropTypes.string),
  tReady: PropTypes.bool,
  windowIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};
