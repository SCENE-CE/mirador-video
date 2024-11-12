import flatten from 'lodash/flatten';
import flattenDeep from 'lodash/flattenDeep';
import React, {useRef, useState, useEffect, useCallback} from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withTranslation } from 'react-i18next';
import { withPlugins } from '../extend/withPlugins';
import * as actions from '../state/actions';
import AnnotationItem from '../lib/AnnotationItem';
import AnnotationsOverlayVideo from '../containers/AnnotationsOverlayVideo';
import WindowCanvasNavigationControlsVideo from '../containers/WindowCanvasNavigationControlsVideo';
import {
  getConfig,
  getCurrentCanvas,
  getCurrentCanvasWorld,
  getWindowMutedStatus,
  getWindowPausedStatus,
  getWindowCurrentTime,
  getWindowTextTrackDisabledStatus,
  getPresentAnnotationsOnSelectedCanvases,
} from '../state/selectors';

export const ORIENTATIONS = {
  LANDSCAPE: 'landscape',
  PORTRAIT: 'portrait',
};

const VideoViewer = ({
  annotations, canvas, currentTime, muted, paused, setCurrentTime, setPaused,
  setHasTextTrack, textTrackDisabled, videoOptions, windowId,
}) => {
  const videoRef = useRef();
  const timerRef = useRef(null);
  const [timeState, setTimeState] = useState({ start: 0, time: currentTime * 1000 });

  const updateTime = useCallback(() => {
    const elapsedTime = Date.now() - timeState.start;
    const videoDuration = canvas.getDuration();

    // Stop timer if elapsed time exceeds video duration
    if (videoDuration && elapsedTime / 1000 >= videoDuration) {
      setPaused(true);  // Pause at end
      setCurrentTime(videoDuration);
      clearInterval(timerRef.current);
    } else {
      setTimeState(prevState => ({ ...prevState, time: elapsedTime }));
      setCurrentTime(elapsedTime / 1000);
    }
  }, [timeState.start, setCurrentTime, setPaused, canvas]);

  const timerStart = useCallback(() => {
    setTimeState({ start: Date.now() - currentTime * 1000, time: currentTime * 1000 });
    timerRef.current = setInterval(updateTime, 100);
  }, [currentTime, updateTime]);

  const timerStop = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (paused) {
      timerStop();
    } else {
      timerStart();
    }
    return () => timerStop(); // Cleanup on unmount
  }, [paused, timerStart, timerStop]);

  useEffect(() => {
    setPaused(true);
    const video = videoRef.current;
    if (video && video.textTracks.length > 0) setHasTextTrack(true);
  }, [setPaused, setHasTextTrack]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = muted;
      if (video.textTracks && video.textTracks.length > 0) {
        const newMode = textTrackDisabled ? 'disabled' : 'showing';
        if (video.textTracks[0].mode !== newMode) {
          video.textTracks[0].mode = newMode;
        }
      }
    }
  }, [muted, textTrackDisabled]);

  const videoResources = flatten(
    flattenDeep(
      canvas.getContent().map(annot => {
        const annotation = new AnnotationItem(annot.__jsonld);
        const temporalfragment = annotation.temporalfragmentSelector;
        if (temporalfragment && temporalfragment.length > 0) {
          const start = temporalfragment[0] || 0;
          const end = temporalfragment.length > 1 ? temporalfragment[1] : Number.MAX_VALUE;
          if (start <= currentTime && currentTime < end) {
            return {};
          }
        }
        const body = annot.getBody();
        return { body, temporalfragment };
      }),
    ).filter(resource => resource.body && resource.body[0].__jsonld && resource.body[0].__jsonld.type === 'Video'),
  );

  const vttContent = annotations
    .flatMap(annoPage => annoPage.json.items.map(anno => anno.body))
    .flat()
    .filter(body => body.format === 'text/vtt');

  const len = videoResources.length;
  const video = len > 0 ? videoResources[len - 1].body[0] : null;
  const videoTargetTemporalfragment = len > 0 ? videoResources[len - 1].temporalfragment : [];

  const currentOrientation = video && video.getWidth() > video.getHeight()
    ? ORIENTATIONS.LANDSCAPE
    : ORIENTATIONS.PORTRAIT;

  const debugPositioning = true;

  return (
    <div
      className="outerContainer"
      style={{
        border: debugPositioning ? '6px solid blue' : 'none',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {video && (
        <>
          <div style={{
            border: debugPositioning ? '6px solid red' : 'none',
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '122px',
            flexDirection: currentOrientation === ORIENTATIONS.LANDSCAPE ? 'row' : 'column',
            backgroundColor: 'black',
          }}
          >
            <div style={{
              border: debugPositioning ? '6px solid green' : 'none',
              maxWidth: '100%',
              objectFit: 'contain',
            }}
            >
              <video
                style={{
                  border: debugPositioning ? '6px solid blue' : 'none',
                  position: 'absolute',
                  width: currentOrientation === ORIENTATIONS.LANDSCAPE ? '100%' : 'auto',
                  height: currentOrientation === ORIENTATIONS.PORTRAIT ? '100%' : 'auto',
                }}
                key={video.id}
                ref={videoRef}
                {...videoOptions}
              >
                <source src={video.id} type={video.getFormat()} />
                {vttContent.map(vttc => (
                  <track key={vttc.id} src={vttc.id} srcLang={vttc.language} />
                ))}
              </video>

              <AnnotationsOverlayVideo
                windowId={windowId}
                videoRef={videoRef}
                videoTarget={videoTargetTemporalfragment}
                key={`${windowId} ${video.id}`}
                currentOrientation={currentOrientation}
                highlightAllAnnotations
                style={{
                  height: '100%',
                  width: '100%',
                  objectFit: 'contain',
                  border: debugPositioning ? '6px solid yellow' : 'none',
                }}
              />
            </div>
          </div>
          <WindowCanvasNavigationControlsVideo windowId={windowId} />
        </>
      )}
    </div>
  );
};

VideoViewer.propTypes = {
  annotations: PropTypes.arrayOf(PropTypes.object),
  canvas: PropTypes.object,
  currentTime: PropTypes.number,
  muted: PropTypes.bool,
  paused: PropTypes.bool,
  setCurrentTime: PropTypes.func,
  setHasTextTrack: PropTypes.func,
  setPaused: PropTypes.func,
  textTrackDisabled: PropTypes.bool,
  videoOptions: PropTypes.object,
  windowId: PropTypes.string.isRequired,
};

VideoViewer.defaultProps = {
  annotations: [],
  canvas: {},
  currentTime: 0,
  muted: false,
  paused: true,
  setCurrentTime: () => {},
  setHasTextTrack: () => {},
  setPaused: () => {},
  textTrackDisabled: true,
  videoOptions: {},
};

const mapStateToProps = (state, { windowId }) => ({
  annotations: getPresentAnnotationsOnSelectedCanvases(state, { windowId }),
  canvas: (getCurrentCanvas(state, { windowId }) || {}),
  canvasWorld: getCurrentCanvasWorld(state, { windowId }),
  currentTime: getWindowCurrentTime(state, { windowId }),
  muted: getWindowMutedStatus(state, { windowId }),
  paused: getWindowPausedStatus(state, { windowId }),
  textTrackDisabled: getWindowTextTrackDisabledStatus(state, { windowId }),
  videoOptions: getConfig(state).videoOptions,
});

const mapDispatchToProps = (dispatch, { windowId }) => ({
  setCurrentTime: (...args) => dispatch(actions.setWindowCurrentTime(windowId, ...args)),
  setHasTextTrack: (...args) => dispatch(actions.setWindowHasTextTrack(windowId, ...args)),
  setPaused: (...args) => dispatch(actions.setWindowPaused(windowId, ...args)),
});

export default compose(
  withTranslation(),
  connect(mapStateToProps, mapDispatchToProps),
  withPlugins('VideoViewer'),
)(VideoViewer);
