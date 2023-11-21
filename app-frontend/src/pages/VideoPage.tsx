import React, { useEffect, useState } from "react";
import VideoStream from "../components/VideoStream";
import { getImages } from "../services/imageService";
import { GetImagesDTO } from "../types/Box";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { socket } from "../utils/socket";
import { useFetchImages } from "../hooks/fetchImages";
import { getSortedKeys } from "../services/getSortedKeys";


const VideoPage: React.FC = () => {
  const [imagePaths, setImagePaths] = useState<GetImagesDTO>({});
  const [progress, setProgress] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(1);

  const [odDataDone, setOdDataDone] = useState(false);
  const limit = 100;

  const updateFrameIndex = (frameIndex: number) => {
    setFrameIndex(frameIndex);
  };

  useEffect(() => {
    const fetchData = async () => {
      const result = await getSortedKeys();
      const sortedKeys = result.data.sortedKeys;
      sortedKeys.forEach((key: string) => {
        imagePaths[key] = null;
      })
      setTotalImages(sortedKeys.length);
    };
    fetchData();
  }, []);

  useFetchImages({
    limit: 100,
    batchCount: 10,
    totalEntries: totalImages,
    odDataDone,
    updateState: (data) => {
      setTotalImages(data.numberOfEntries)
    }
  });


  useEffect(() => {
    if (totalImages === 0) return;
    const incompleteImages = Object.keys(imagePaths).filter((key) => {
      return imagePaths[key] === null;
    });
    const progressRate = Math.round(

      ((totalImages - incompleteImages.length) / totalImages) * 100
    );
    setProgress(progressRate);
  }, [totalImages, imagePaths]);


  const handleOdDataAdded = (data: GetImagesDTO) => {
    console.log(data)
    setImagePaths((prev) => {
      const key = Object.keys(data)[0];
      return { ...prev, [key]: data[key] };
    });
  };

  const handleOdDataDone = () => {
    setOdDataDone(true);
    setProgress(Object.keys(imagePaths).length / totalImages);
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
