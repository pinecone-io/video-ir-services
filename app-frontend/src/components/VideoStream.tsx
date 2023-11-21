import React, { useCallback, useEffect, useRef, useState } from "react";
import { LabeledBoundingBox, GetImagesDTO } from "../types/Box";
import BoundingBoxes from "./BoundingBoxes";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import LabelingControls, { LabeledImage } from "./LabelingControls";
import VideoScrubber from "./VideoScrubber";
// import { FilesLoadingStatus } from "./FilesLoadingStatus";

const CANVAS_WIDTH = 1269;
const CANVAS_HEIGHT = 707;

type VideoStreamProps = {
  imagePaths: GetImagesDTO;

  refreshImages: () => Promise<boolean>;
  updateFrameIndex: (frameIndex: number) => void;
  progressRate: number;
};

const VideoStream: React.FC<VideoStreamProps> = (props) => {
  const [labeledBoundingBox, setLabeledBoundingBox] = useState<
    LabeledBoundingBox[]
  >([]);


  const FPS = 25;

  // TODO: Get this from the backend
  const video =
    "https://video-streaming-images.s3.us-west-2.amazonaws.com/car-race/video/car-race.mp4";

  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [isPlaying, setPlay] = useState<boolean>(true);
  const [selectedBox, setSelectedBox] = useState<string>("");
  const [selectedBoxes, setSelectedBoxes] = useState<LabeledImage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const prevSelectedBox = useRef(selectedBox);
  const videoRef = useRef<HTMLVideoElement | null>(null);


  useEffect(() => {
    if (prevSelectedBox.current !== selectedBox) {
      console.log("!!!!!", selectedBox)
      setLoading(true);
      prevSelectedBox.current = selectedBox;
      const refresh = async () => {
        await props.refreshImages();

      }
      refresh()
    }
  }, [selectedBox, prevSelectedBox, props]);

  const handleGotSimilarResults = async () => {
    console.log("handleGotSimilarResults");
    setLoading(false);
  }


  useEffect(() => {
    if (!isPlaying) return;
    const intervalId = setInterval(() => {
      props.updateFrameIndex(frameIndex + 1);
    }, 1000 / FPS);

    return () => {
      intervalId && clearInterval(intervalId);
    };
    // TODO: Fix this dependency array
  }, [frameIndex, isPlaying, FPS, props]);

  useEffect(() => {
    const key = Object.keys(props.imagePaths)[frameIndex];
    const boundingBoxes: LabeledBoundingBox[] = props.imagePaths[key]?.labeledBoundingBoxes || [];
    setLabeledBoundingBox(boundingBoxes);
  }, [props.imagePaths, frameIndex]);


  const onEachFrame = useCallback(() => {
    const time = videoRef.current?.currentTime;
    if (time) {
      const frame = Math.floor(time * FPS);
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
          position: "relative",
        }}
      >
        <video
          ref={videoRef}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          <source src={video} type="video/mp4"></source>
        </video>

        <div className="flex justify-between items-center bg-gray-100 p-4 mt-[10px] bg-gray-200">
          <div className="flex items-center pt-[15px]">
            <button
              className="m-2 p-[10px] border border-gray-300 rounded-lg shadow-sm hover:shadow-md bg-white hover:bg-gray-200 transition duration-200 ease-in-out text-gray-600"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime -= 1 / FPS; // Rewind by one frame
                }
              }}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              className="m-2 p-[10px] border border-gray-300 rounded-lg shadow-sm hover:shadow-md bg-white hover:bg-gray-200 transition duration-200 ease-in-out text-gray-600"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime += 1 / FPS; // Fast forward by one frame
                }
              }}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            <button
              className="m-2 p-[10px] border border-gray-300 rounded-lg shadow-sm hover:shadow-md bg-white hover:bg-gray-200 transition duration-200 ease-in-out text-gray-600"
              onClick={() => videoRef.current?.play()}
            >
              <FontAwesomeIcon icon={faPlay} />
            </button>
            <button
              className="m-2 p-[10px] border border-gray-300 rounded-lg shadow-sm hover:shadow-md bg-white hover:bg-gray-200 transition duration-200 ease-in-out text-gray-600"
              onClick={() => videoRef.current?.pause()}
            >
              <FontAwesomeIcon icon={faPause} />
            </button>
          </div>
          <div className="w-4/5 flex justify-start">
            <VideoScrubber videoRef={videoRef} />
          </div>

        </div>




        {labeledBoundingBox && (
          <BoundingBoxes
            labeledBoundingBox={labeledBoundingBox}
            selectedBoxes={selectedBoxes}
            loading={loading}
            onBoxSelected={(boxId: string) => {
              setSelectedBox(boxId);
              setPlay(false);
            }}
          />
        )}
      </div>
      <div className="flex justify-center  w-full mt-[67px]">
        <LabelingControls
          progressRate={props.progressRate}
          selectedBox={selectedBox}
          setSelectedBoxes={setSelectedBoxes}
          refreshImages={props.refreshImages}
          handleGotSimilarResults={handleGotSimilarResults}
        />
      </div>
      <div id="prog" className="flex justify-between flext-grow items-center  bg-gray-100 p-4 mb-[50px] bg-gray-200 mt-4">
        {/* <FilesLoadingStatus cols={100} rows={10} imagePaths={props.imagePaths} /> */}
      </div>
      <footer className="text-center text-black p-smallFooter w-full bg-white z-50">
        <p className="p-2">All Rights Reserved by Pinecone</p>
      </footer>
    </>
  );
};

export default VideoStream;
