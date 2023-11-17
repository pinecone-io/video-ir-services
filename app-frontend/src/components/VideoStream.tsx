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

  const FPS = 25;

  // TODO: Get this from the backend
  const video = "https://video-streaming-images.s3.us-west-2.amazonaws.com/car-race/video/car-race.mp4"

  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [isPlaying, setPlay] = useState<boolean>(true);
  const [selectedBox, setSelectedBox] = useState<string>("");
  const [selectedBoxes, setSelectedBoxes] = useState<LabeledImage[]>([]);
  const prevSelectedBox = useRef(selectedBox);

  useEffect(() => {
    if (prevSelectedBox.current !== selectedBox) {
      prevSelectedBox.current = selectedBox;
      props.refreshImages();
    }
  }, [selectedBox, prevSelectedBox, props]);
  const moveVideoFrameBy = (x: number) => {
    const newFrameIndex =
      frameIndex + x < 0 ? props.loadedImages.length : frameIndex;

    const fi = (newFrameIndex + x) % props.loadedImages.length;
    setFrameIndex((newFrameIndex + x) % props.loadedImages.length);
    props.updateFrameIndex(fi);
  };

  useEffect(() => {
    if (!props.loadedImages.length || !isPlaying) return;
    const intervalId = setInterval(() => {
      moveVideoFrameBy(1);
    }, 1000 / FPS);

    return () => {
      intervalId && clearInterval(intervalId);
    };
    // TODO: Fix this dependency array
  }, [props.loadedImages, frameIndex, isPlaying, FPS]);

  useEffect(() => {
    const key = Object.keys(props.imagePaths)[frameIndex];

    const boundingBoxes: LabeledBoundingBox[] =
      props.imagePaths[key]?.labeledBoundingBoxes;
    setLabeledBoundingBox(boundingBoxes);
  }, [props.imagePaths, frameIndex]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const scrollPosition = event.currentTarget.scrollTop;
    const maxScroll = event.currentTarget.scrollHeight - event.currentTarget.clientHeight;
    const videoDuration = videoRef.current?.duration || 0;
    const newTime = (scrollPosition / maxScroll) * videoDuration;
    videoRef.current && (videoRef.current.currentTime = newTime);
  };

  return (
    <>
      <div
        className="relative"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          position: "relative"
        }}
      >
        <video
          ref={videoRef}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          controls
        >
          <source src={video} type="video/mp4"></source>
        </video>
        <div className="flex justify-between items-center">
          <div>
            <button className="m-2 p-2 border border-black rounded" onClick={() => videoRef.current?.play()}>
              <FontAwesomeIcon icon={faPlay} />
            </button>
            <button className="m-2 p-2 border border-black rounded" onClick={() => videoRef.current?.pause()}>
              <FontAwesomeIcon icon={faPause} />
            </button>
            <button className="m-2 p-2 border border-black rounded" onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime += 1 / FPS; // Fast forward by one frame
              }
            }}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            <button className="m-2 p-2 border border-black rounded" onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime -= 1 / FPS; // Rewind by one frame
              }
            }}>
              <FontAwesomeIcon icon={faChevronLeft} color="black" />
            </button>
          </div>
          <div
            className="h-full w-5 overflow-y-scroll bg-black bg-opacity-50 scrollbar-thin scrollbar-thumb-white scrollbar-thumb-opacity-50"
            onScroll={handleScroll}
          >
            <div
              className="h-full w-full bg-white bg-opacity-50"
            />
          </div>
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
      </div >
      <div className="flex justify-center  w-full mt-[100px] min-h-[FPS0px]">
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

