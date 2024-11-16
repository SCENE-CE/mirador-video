import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';

const CustomVideoPlayer = ({ url }) => {
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
        config={{
          peertube: {
            controls: 1,
            controlBar: 1,
            peertubeLink: 0,
            title: 0,
            warningTitle: 0,
             p2p: 0,
            autoplay: 0,
            api: 1
          },
        }}
      />

      {/* Custom Controls */}
      <div className="controls">
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
