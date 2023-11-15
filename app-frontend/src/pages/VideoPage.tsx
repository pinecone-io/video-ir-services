import React, { useEffect, useState } from "react";
import VideoStream from "../components/VideoStream";
import { getImages } from "../services/imageService";
import { formatImageUrl } from "../utils/formatImageUrl";
import { GetImagesDTO } from "../types/Box";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { socket } from "../utils/socket";
import { useFps } from "../hooks/fpsHook";
import { resetImages } from "../services/resetImagesService";

const initialFetch = true;
const VideoPage: React.FC = () => {
  const [imagePaths, setImagePaths] = useState<GetImagesDTO>({});
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [progress, setProgress] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [nextFetchIndex, setNextFetchIndex] = useState(0); // Add this line


  const [odDataDone, setOdDataDone] = useState(false);
  const { FPS } = useFps();
  const limit = 100

  // if (initialFetch) {
  //   console.log("Resetting images");
  //   initialFetch = false;
  //   resetImages();
  // }

  const updateFrameIndex = (frameIndex: number) => {
    setFrameIndex(frameIndex);
  };
  // Fetch all image paths from the server
  useEffect(() => {
    const fetchImages = async () => {
      if (frameIndex + 1 >= nextFetchIndex) {
        await getImages({ offset: frameIndex, limit });
        setNextFetchIndex(frameIndex + limit); // Update the nextFetchIndex after fetching
      }
    };

    fetchImages();
  }, [frameIndex, nextFetchIndex]); //


  const handleOdDataAdded = (data: GetImagesDTO) => {
    setImagePaths((prev) => {
      return {
        ...prev,
        ...data,
      };
    });
    // setFrameIndex(frameIndex + 10);
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


  useEffect(() => {
    console.log(imagePaths);
  }, [imagePaths]);

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
