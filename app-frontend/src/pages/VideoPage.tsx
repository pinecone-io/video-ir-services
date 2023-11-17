import React, { useEffect, useRef, useState } from "react";
import VideoStream from "../components/VideoStream";
import { getImages } from "../services/imageService";
import { GetImagesDTO } from "../types/Box";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { socket } from "../utils/socket";

const VideoPage: React.FC = () => {
  const [imagePaths, setImagePaths] = useState<GetImagesDTO>({});
  // TODO: Get rid of this
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);

  // TODO: Fix this
  const [progress, setProgress] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [nextFetchIndex, setNextFetchIndex] = useState(0); // Add this line


  const [odDataDone, setOdDataDone] = useState(false);
  const limit = 100

  const updateFrameIndex = (frameIndex: number) => {
    setFrameIndex(frameIndex);
  };


  const fetchingImagesRef = useRef(false); // Add this line

  useEffect(() => {
    const fetchImages = async () => {
      console.log(nextFetchIndex, Object.keys(imagePaths).length)
      if (!odDataDone && !fetchingImagesRef.current && Object.keys(imagePaths).length === nextFetchIndex) {
        fetchingImagesRef.current = true;
        const images = await getImages({ offset: nextFetchIndex, limit });
        if (images) {
          setNextFetchIndex(prevIndex => prevIndex + limit); // Update the nextFetchIndex after fetching
        }
        fetchingImagesRef.current = false;
      }
    };

    fetchImages();
  }, [nextFetchIndex, odDataDone, imagePaths]); // Removed fetchingImages


  const handleOdDataAdded = (data: GetImagesDTO) => {
    console.log("odDataAdded", data)
    setImagePaths((prev) => {
      return {
        ...prev,
        ...data,
      };
    });
  };

  const handleOdDataDone = () => {
    setOdDataDone(true);
  };

  useEffect(() => {
    socket.on("odDataAdded", handleOdDataAdded);
    socket.on("odDataDone", handleOdDataDone);
    return () => {
      socket.off("odDataAdded", handleOdDataAdded);
      socket.off("odDataDone", handleOdDataDone);
    };
  });

  const refreshImages = () => {
    getImages({ offset: frameIndex, limit })
      .then((response) => response.data)
  };

  return (
    <>
      {progress !== 100 && (
        <div className="m-auto mt-[20px] flex w-full mb-9 items-center justify-center">
          <div className="text-black font-normal text-base16 mr-[20px]">
            Downloading Images:
          </div>
          <div className="w-[427px] h-[15px] bg-gray-400 rounded-full">
            <div
              className="bg-cta-100 h-[15px] p-0.5 leading-none rounded-full"
              style={{ width: progress + "%" }}
            ></div>
          </div>
        </div>
      )}
      <DndProvider backend={HTML5Backend}>
        <div className="min-h-screen bg-white text-black w-full">
          <div className="flex flex-wrap justify-center">
            <VideoStream
              imagePaths={imagePaths}
              loadedImages={loadedImages}
              refreshImages={refreshImages}
              updateFrameIndex={updateFrameIndex}
            />
          </div>
        </div>
      </DndProvider>
    </>
  );
};

export default VideoPage;
