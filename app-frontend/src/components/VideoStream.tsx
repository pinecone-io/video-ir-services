import React, { useEffect, useRef, useState } from "react";
import { LabeledBoundingBox, GetImagesDTO } from "../types/Box";
import BoundingBoxes from "./BoundingBoxes";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import LabelingControls from "./LabelingControls";
import { useFps } from "../hooks/fpsHook";

const CANVAS_WIDTH = 1269;
const CANVAS_HEIGHT = 707;

type VideoStreamProps = {
  imagePaths: GetImagesDTO;
  loadedImages: HTMLImageElement[];
  refreshImages: () => void;
};

const VideoStream: React.FC<VideoStreamProps> = (props) => {
  const [labeledBoundingBox, setLabeledBoundingBox] = useState<
    LabeledBoundingBox[]
  >([]);

  const { FPS } = useFps();

  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [isPlaying, setPlay] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedBox, setSelectedBox] = useState<string>("");
  const [selectedBoxes, setSelectedBoxes] = useState<Array<{ boxId: string; label: string }>>([]);
  const prevSelectedBox = useRef(selectedBox);

  const drawFrame = (frame: number) => {
    // Ensure that canvas exists
    if (!canvasRef.current) return;

    const img = props.loadedImages[frame];
    const ctx = canvasRef.current.getContext("2d");

    ctx?.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  };

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

    setFrameIndex((newFrameIndex + x) % props.loadedImages.length);
  };

  // Autoplay frames
  useEffect(() => {
    if (!props.loadedImages.length) return;
    const intervalId =
      isPlaying &&
      setInterval(() => {
        // Increment frame index and loop back if at the end
        moveVideoFrameBy(1);
      }, 1000 / FPS);

    // Clean up the interval when component unmounts
    return () => {
      intervalId && clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.loadedImages, frameIndex, isPlaying]);

  // Draw frame when index is changed
  useEffect(() => {
    if (props.loadedImages.length > 0) {
      drawFrame(frameIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.loadedImages, frameIndex]);

  // Change LabeledBoundingBox for specific frame
  useEffect(() => {
    const key = Object.keys(props.imagePaths)[frameIndex];
    const boundingBoxes: LabeledBoundingBox[] =
      props.imagePaths[key]?.labeledBoundingBoxes;
    setLabeledBoundingBox(boundingBoxes);
  }, [props.imagePaths, frameIndex]);

  return (
    <>
      <div
        className="relative"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
        }}
      >
        {props.imagePaths && (
          <canvas
            className="rounded-xl10"
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          ></canvas>
        )}

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
        <div className="w-full absolute bottom-0 left-0 right-0 bg-primary-800 opacity-80 rounded-10 p-overlay flex items-center">
          <p className="text-white text-base20 font-medium">
            FPS: {FPS} | Frame Index: {frameIndex}
          </p>
          {/* Controlls */}
          <div className="flex items-center absolute inset-x-x45">
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
                className={`text-white p-controlsPlayBtn ${!isPlaying ? "ml-[6px]" : ""
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
          </div>
        </div>
      </div>
      <div className="flex justify-center bg-primary-1000 w-full mt-[100px] min-h-[300px]">
        <LabelingControls selectedBox={selectedBox} setSelectedBoxes={setSelectedBoxes} refreshImages={props.refreshImages} />
      </div>
      <footer className="text-center text-black p-smallFooter fixed bottom-0 w-full bg-white z-50">
        <p className="p-2">All Rights Reserved by Pinecone</p>
      </footer>
    </>
  );
};

export default VideoStream;
