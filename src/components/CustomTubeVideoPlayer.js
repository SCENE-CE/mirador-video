import React, { useState, useRef } from 'react';
import ReactPlayer from '@celluloid/react-player';
import {getWindowPausedStatus} from "../state/selectors";

const CustomVideoPlayer = ({ url, paused }) => {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [played, setPlayed] = useState(0);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgress = (progress) => {
    setPlayed(progress.played);
  };

  const handleSeekChange = (e) => {
    const newPlayed = parseFloat(e.target.value);
    setPlayed(newPlayed);
    playerRef.current.seekTo(newPlayed);
  };

  return (
    <div>
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={isPlaying}
        volume={volume}
        onProgress={handleProgress}
        controls={false} // Hide default controls
        width="100%"
        height="100%"
        controls={false}
        pip={false}
        playbackRate={1}
        played={played}
        volume={volume}
        playing={!paused}
        config={{
          peertube: {
            controls: 0,
            mode: 'p2p-media-loader',
          },
        }}
      />

      {/* Custom Controls */}
      <div className="controls" style={{ position: 'fixed', zIndex: 10000}}> {/* TODO */}
        <button onClick={togglePlay}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step="any"
          value={played}
          onChange={handleSeekChange}
        />

      </div>
    </div>
  );
};

export default CustomVideoPlayer;
