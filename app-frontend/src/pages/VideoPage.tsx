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
  // const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);

  // TODO: Fix this
  const [progress, setProgress] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [nextFetchIndex, setNextFetchIndex] = useState(0); // Add this line
  const [totalImages, setTotalImages] = useState(0);

  const [odDataDone, setOdDataDone] = useState(false);
  const limit = 100;

  const updateFrameIndex = (frameIndex: number) => {
    setFrameIndex(frameIndex);
  };

  const fetchingImagesRef = useRef(false); // Add this line

  useEffect(() => {
    const fetchImages = async () => {
      console.log(
        !odDataDone,
        !fetchingImagesRef.current,
        Object.keys(imagePaths).length, nextFetchIndex
      )
      if (
        !odDataDone && (Object.keys(imagePaths).length < totalImages || totalImages === 0)
      ) {
        fetchingImagesRef.current = true;
        const result = await getImages({ offset: nextFetchIndex, limit });
        const numberOfEntries = result.data.numberOfEntries;
        if (numberOfEntries) {
          if (totalImages === 0) {
            setTotalImages(numberOfEntries);
          }
          setNextFetchIndex((prevIndex) => prevIndex + limit); // Update the nextFetchIndex after fetching
        }
        fetchingImagesRef.current = false;
      }
    };

    fetchImages();
  }, [nextFetchIndex, odDataDone, imagePaths, totalImages]); // Removed fetchingImages

  useEffect(() => {
    if (totalImages === 0) return;
    const progressRate = Math.round(
      (Object.keys(imagePaths).length / totalImages) * 100
    );
    setProgress(progressRate);
  }, [totalImages, imagePaths]);

  const handleOdDataAdded = (data: GetImagesDTO) => {
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

  const refreshImages = async () => {
    await getImages({ offset: frameIndex, limit }).then((response) => response.data);
    return false
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="h-full bg-white text-black w-full">
          <div className="flex flex-wrap justify-center h-full pt-[34px]">
            <VideoStream
              imagePaths={imagePaths}
              refreshImages={refreshImages}
              updateFrameIndex={updateFrameIndex}
              progressRate={progress}
            />
          </div>
        </div>
      </DndProvider>
    </>
  );
};

export default VideoPage;
