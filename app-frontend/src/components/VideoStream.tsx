import React, { useCallback, useEffect, useRef, useState } from "react";
import { LabeledBoundingBox, GetImagesDTO } from "../types/Box";
import BoundingBoxes from "./BoundingBoxes";

// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faPlay,
//   faPause,
//   faChevronLeft,
//   faChevronRight,
// } from "@fortawesome/free-solid-svg-icons";
import LabelingControls, { LabeledImage } from "./LabelingControls";

const CANVAS_WIDTH = 1269;
const CANVAS_HEIGHT = 707;

type VideoStreamProps = {
  imagePaths: GetImagesDTO;
  loadedImages: HTMLImageElement[];
  refreshImages: () => void;
  updateFrameIndex: (frameIndex: number) => void;
};

const VideoStream: React.FC<VideoStreamProps> = (props) => {
  const [labeledBoundingBox, setLabeledBoundingBox] = useState<
    LabeledBoundingBox[]
  >([]);

  const [FPS, setFps] = useState(30);
  const [editingFps, setEditingFps] = useState<boolean>(false);
  const [video, setVideo] = useState<string>("https://video-streaming-images.s3.us-west-2.amazonaws.com/car-race/video/car-race.mp4")

  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [isPlaying, setPlay] = useState<boolean>(true);
  // const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedBox, setSelectedBox] = useState<string>("");
  const [selectedBoxes, setSelectedBoxes] = useState<LabeledImage[]>([]);
  const prevSelectedBox = useRef(selectedBox);

  // const drawFrame = (frame: number) => {
  //   // Ensure that canvas exists
  //   if (!canvasRef.current) return;

  //   const img = props.loadedImages[frame];
  //   const ctx = canvasRef.current.getContext("2d");

  //   ctx?.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // };

  useEffect(() => {
    if (prevSelectedBox.current !== selectedBox) {
      prevSelectedBox.current = selectedBox;
      props.refreshImages();
    }
  }, [selectedBox, prevSelectedBox, props]);
  const moveVideoFrameBy = (x: number) => {
    // In case we are looping backwards
    const newFrameIndex =
      frameIndex + x < 0 ? props.loadedImages.length : frameIndex;

    const fi = (newFrameIndex + x) % props.loadedImages.length;
    // console.log(fi)
    setFrameIndex((newFrameIndex + x) % props.loadedImages.length);
    props.updateFrameIndex(fi);
  };

  // Autoplay frames
  useEffect(() => {
    if (!props.loadedImages.length || !isPlaying) return;
    const intervalId = setInterval(() => {
      // Increment frame index and loop back if at the end
      moveVideoFrameBy(1);
    }, 1000 / FPS);

    // Clean up the interval when component unmounts or when isPlaying changes
    return () => {
      intervalId && clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.loadedImages, frameIndex, isPlaying, FPS]);

  // Draw frame when index is changed
  // useEffect(() => {
  //   if (props.loadedImages.length > 0) {
  //     drawFrame(frameIndex);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [props.loadedImages, frameIndex]);

  // Change LabeledBoundingBox for specific frame
  useEffect(() => {
    const key = Object.keys(props.imagePaths)[frameIndex];
    console.log("key", key, props.imagePaths[key])

    const boundingBoxes: LabeledBoundingBox[] =
      props.imagePaths[key]?.labeledBoundingBoxes;
    setLabeledBoundingBox(boundingBoxes);
    // console.log("bb", boundingBoxes);
  }, [props.imagePaths, frameIndex]);

  // Indexer is runned on same video with video limit 60s, 10fps with chunk duration of 3 to collect infromations about bboxes
  // Sample video is downlaode form same yt url and limited to 60x and 10fps
  // Goal is to conect video with bboxes

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const onEachFrame = useCallback(() => {
    const time = videoRef.current?.currentTime;
    // NOTE PLEASE SET CORRECT FPS OF PROCESSED VIDEO - One that is passed in indexing form
    if (time) {
      const frame = Math.floor(time * 30);
      setFrameIndex(frame);
      props.updateFrameIndex(frame);
    }
    requestAnimationFrame(onEachFrame);
  }, [props]);

  useEffect(() => {
    requestAnimationFrame(onEachFrame);
  }, [onEachFrame]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1;
    }
  }, []);

  return (
    <>
      <div
        className="relative"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
        }}
      >
        <video
          ref={videoRef}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          controls
        >
          <source src={video} type="video/mp4"></source>
        </video>
        <div className="video-controls">
          <button onClick={() => videoRef.current?.play()}>Play</button>
          <button onClick={() => videoRef.current?.pause()}>Pause</button>
          <button onClick={() => {
            if (videoRef.current) {
              videoRef.current.currentTime += 1 / 30; // Fast forward by one frame
            }
          }}>Fast Forward</button>
          <button onClick={() => {
            if (videoRef.current) {
              videoRef.current.currentTime -= 1 / 30; // Rewind by one frame
            }
          }}>Rewind</button>
        </div>

        {labeledBoundingBox && (
          <BoundingBoxes
            labeledBoundingBox={labeledBoundingBox}
            selectedBoxes={selectedBoxes}
            onBoxSelected={(boxId: string) => {
              setSelectedBox(boxId);
              setPlay(false);
            }}
          />
        )}
        {/* <div className="w-full absolute bottom-0 left-0 right-0 bg-primary-800 opacity-80 rounded-10 p-overlay flex items-center"> */}
        {/* <p className="text-white text-base20 font-medium">
            <span>
              {editingFps ? (
                <span>
                  <input
                    type="number"
                    value={FPS}
                    onChange={(e) => {
                      setFps(parseInt(e.currentTarget.value));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setEditingFps(false);
                      }
                    }}
                  />
                </span>
              ) : (
                <span onClick={() => setEditingFps(true)}>FPS: {FPS}</span>
              )}
            </span>{" "}
            | Frame Index: {frameIndex} | {Object.keys(props.imagePaths).length}
          </p> */}
        {/* Controlls */}
        {/* <div className="flex items-center absolute inset-x-x45">
            <button
              className="disabled:opacity-25 border-3 border-color-white w-controlsCircle h-controlsCircle flex items-center justify-center rounded-50"
              disabled={isPlaying}
              onClick={() => moveVideoFrameBy(-1)}
            >
              <FontAwesomeIcon
                size="1x"
                icon={faChevronLeft}
                className="p-controlsBtn text-white"
              />
            </button>
            <button
              className="mx-mx40 w-controlsPlayCircle h-controlsPlayCircle border-5 border-color-white flex items-center justify-center rounded-50"
              onClick={() => setPlay(!isPlaying)}
            >
              <FontAwesomeIcon
                size="2x"
                className={`text-white p-controlsPlayBtn ${
                  !isPlaying ? "ml-[6px]" : ""
                }`}
                icon={isPlaying ? faPause : faPlay}
              />
            </button>
            <button
              className="disabled:opacity-25 border-3 border-color-white w-controlsCircle h-controlsCircle flex items-center justify-center rounded-50"
              disabled={isPlaying}
              onClick={() => moveVideoFrameBy(1)}
            >
              <FontAwesomeIcon
                size="1x"
                icon={faChevronRight}
                className="p-controlsBtn text-white"
              />
            </button>
          </div> */}
        {/* </div> */}
      </div>
      <div className="flex justify-center  w-full mt-[100px] min-h-[300px]">
        <LabelingControls
          selectedBox={selectedBox}
          setSelectedBoxes={setSelectedBoxes}
          refreshImages={props.refreshImages}
        />
      </div>
      <footer className="text-center text-black p-smallFooter fixed bottom-0 w-full bg-white z-50">
        <p className="p-2">All Rights Reserved by Pinecone</p>
      </footer>
    </>
  );
};

export default VideoStream;
