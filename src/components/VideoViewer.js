import flatten from 'lodash/flatten';
import flattenDeep from 'lodash/flattenDeep';
import React, { createRef, Component } from 'react';
import PropTypes from 'prop-types';
import ReactPlayer from '@celluloid/react-player';
import AnnotationItem from '../lib/AnnotationItem';
import AnnotationsOverlayVideo from '../containers/AnnotationsOverlayVideo';
import WindowCanvasNavigationControlsVideo from '../containers/WindowCanvasNavigationControlsVideo';

export const ORIENTATIONS = {
  LANDSCAPE: 'landscape',
  PORTRAIT: 'portrait',
};

/** */
export class VideoViewer extends Component {
  /** */
  constructor(props) {
    super(props);
    this.videoRef = createRef();
    this.playerRef = createRef();

    this.state = {
      start: 0,
      time: 0,
    };
  }

  /** */
  componentDidMount() {
    const { setPaused, setHasTextTrack } = this.props;
    setPaused(true);

    const video = this.videoRef.current;
    if (video && video.textTracks.length > 0) setHasTextTrack(true);
  }

  /** */
  componentDidUpdate(prevProps) {
    const {
      canvas, currentTime, muted, paused,
      setCurrentTime, setPaused,
      textTrackDisabled,
    } = this.props;

    if (paused !== prevProps.paused) {
      if (currentTime === 0) {
        this.timerReset();
      }
      if (paused) {
        this.timerStop();
      } else {
        this.timerStart();
      }
    }
    if (currentTime !== prevProps.currentTime) {
      const duration = canvas.getDuration();
      if (duration && duration < currentTime) {
        if (!paused) {
          setPaused(true);
          setCurrentTime(0);
          this.timerReset();
        }
      }
    }
    const video = this.videoRef.current;
    if (video) {
      if (video.muted !== muted) {
        video.muted = muted;
      }
      if (video.textTracks && video.textTracks.length > 0) {
        const newMode = textTrackDisabled ? 'disabled' : 'showing';
        if (video.textTracks[0].mode !== newMode) {
          video.textTracks[0].mode = newMode;
        }
      }
    }
  }

  /** */
  componentWillUnmount() {
    this.timerStop();
  }

  /** */
  timerStart() {
    const { currentTime } = this.props;
    this.setState({
      start: Date.now() - currentTime * 1000,
      time: currentTime * 1000,
    });
    this.timer = setInterval(() => {
      const { setCurrentTime } = this.props;
      this.setState(prevState => ({
        time: Date.now() - prevState.start,
      }));
      const { time } = this.state;
      setCurrentTime(time / 1000);
    }, 100);
  }

  /** */
  timerStop() {
    clearInterval(this.timer);
  }

  /** */
  timerReset() {
    this.setState({ time: 0 });
  }

  /* eslint-disable jsx-a11y/media-has-caption */
  /** */
  render() {
    const {
      annotations, canvas, currentTime, videoOptions, windowId, paused,
    } = this.props;

    const videoResources = flatten(
      flattenDeep([
        canvas.getContent().map(annot => {
          const annotaion = new AnnotationItem(annot.__jsonld);
          const temporalfragment = annotaion.temporalfragmentSelector;
          if (temporalfragment && temporalfragment.length > 0) {
            const start = temporalfragment[0] || 0;
            const end = (temporalfragment.length > 1) ? temporalfragment[1] : Number.MAX_VALUE;
            if (start <= currentTime && currentTime < end) {
              //
            } else {
              return {};
            }
          }
          const body = annot.getBody();
          return { body, temporalfragment };
        }),
      ]).filter((resource) => resource.body && resource.body[0].__jsonld && resource.body[0].__jsonld.type === 'Video'),
    );

    // TODO Check vtt usage in react player
    const vttContent = annotations
      .flatMap(annoPage => annoPage.json.items.map(anno => anno.body))
      .flat().filter((body) => body.format === 'text/vtt');

    // Only one video can be displayed at a time in this implementation.
    const len = videoResources.length;
    const video = len > 0
      ? videoResources[len - 1].body[0] : null;
    const videoTargetTemporalfragment = len > 0
      ? videoResources[len - 1].temporalfragment : [];

    let currentOrientation;

    if (video) {
      console.log('video', video);
      currentOrientation = video.getWidth() > video.getHeight() ? ORIENTATIONS.LANDSCAPE : ORIENTATIONS.PORTRAIT;
    }

    const debugPositionning = true; // TODO

    return (
      <div
        className="outerContainer"
        style={{
          border: debugPositionning ? '6px solid blue' : 'none',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          overflow: 'auto',
          position: 'relative',
          width: '100%',
        }}
      >
        {video && (
        <>
          <div style={{
            alignItems: 'center',
            backgroundColor: 'black',
            border: debugPositionning ? '6px solid red' : 'none',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '122px', // TODO Space for navigation controls
            position: 'relative',
            // flexDirection: currentOrientation === ORIENTATIONS.LANDSCAPE ? 'row' : 'column',
            width: '100%',
          }}
          >
            <div style={{
              border: debugPositionning ? '6px solid green' : 'none',
              height: '100%',
              maxWidth: '100%',
              position: 'relative',
              marginBottom: '122px', // TODO Space for navigation controls

            }}
            >
              {/* TODO Check what is in videoOptions <video and Vtt track */}
              <ReactPlayer
                height={(currentOrientation === ORIENTATIONS.LANDSCAPE ? '100%' : 'auto')}
                width={(currentOrientation === ORIENTATIONS.LANDSCAPE ? '100%' : 'auto')}

                ref={this.playerRef}
                url={video.id}
                controls={false} // Hide default controls
                pip={false}
                playbackRate={1}
                playing={!paused}
                config={{
                  peertube: {
                    controls: 0,
                    mode: 'p2p-media-loader',
                  },
                }}
                style={{
                  border: debugPositionning ? '6px solid pink' : 'none',
                  position: 'relative', // 'absolute' or 'block
                  maxWidth: '100%',
                }}
              />

              <AnnotationsOverlayVideo
                windowId={windowId}
                videoRef={this.videoRef}
                videoTarget={videoTargetTemporalfragment}
                key={`${windowId} ${video.id}`}
                currentOrientation={currentOrientation}
                highlightAllAnnotations
                style={{
                  height: '100%',
                  width: '100%',
                  objectFit: 'contain',
                  border: debugPositionning ? '6px solid yellow' : 'none',
                }}
              />
            </div>
          </div>
          <WindowCanvasNavigationControlsVideo windowId={windowId} />
        </>
        )}
      </div>
    );
  }

  /* eslint-enable jsx-a11y/media-has-caption */
}

VideoViewer.propTypes = {
  annotations: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/forbid-prop-types
  // eslint-disable-next-line react/forbid-prop-types
  canvas: PropTypes.object,
  captions: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/forbid-prop-types
  currentTime: PropTypes.number,
  muted: PropTypes.bool,
  paused: PropTypes.bool,
  setCurrentTime: PropTypes.func,
  setHasTextTrack: PropTypes.func,
  setPaused: PropTypes.func,
  textTrackDisabled: PropTypes.bool,
  videoOptions: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  windowId: PropTypes.string.isRequired,
};

VideoViewer.defaultProps = {
  annotations: [],
  canvas: {},
  captions: [],
  currentTime: 0,
  muted: false,
  paused: true,
  setCurrentTime: () => {
  },
  setHasTextTrack: () => {
  },
  setPaused: () => {
  },
  textTrackDisabled: true,
  videoOptions: {},
};
