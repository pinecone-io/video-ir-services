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

let initialFetch = true;
const VideoPage: React.FC = () => {
  const [imagePaths, setImagePaths] = useState<GetImagesDTO>({});
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [progress, setProgress] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [odDataDone, setOdDataDone] = useState(false);
  const { FPS } = useFps();

  if (initialFetch) {
    console.log("Resetting images");
    initialFetch = false;
    resetImages();
  }

  const updateFrameIndex = (frameIndex: number) => {
    setFrameIndex(frameIndex);
  };
  // Fetch all image paths from the server
  useEffect(() => {
    // Define a function to fetch images
    const fetchImages = async () => {
      // Check if the object detection data is not done and if the frame index is less than the current frame index plus the FPS rate times 3
      if (!odDataDone && frameIndex < frameIndex + FPS * 5) {
        // Determine the limit for the number of images to fetch
        // Fetch the number of images equivalent to the FPS rate times 3
        const limit = FPS * 5;
        // Check if the images covered in this frameIndex + limit weren't already fetched
        if (frameIndex + limit > Object.keys(imagePaths).length) {
          // Fetch the images from the server
          console.log(`Fetching ${limit}`);
          getImages({ limit: limit });
        }
      }
    };
    fetchImages();
    // .then((response) => response.data)
    // .then(setImagePaths);
  }, [odDataDone, frameIndex, FPS, imagePaths]);

  const handleOdDataAdded = (data: any) => {
    setImagePaths((prev) => {
      return {
        ...prev,
        ...data,
      };
    });
    setFrameIndex(frameIndex + 10);
  };

  const handleOdDataDone = () => {
    setOdDataDone(true);
    console.log(imagePaths);
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
    // getImages({ offset: 0, limit: 10 })
    //   .then((response) => response.data)
    //   .then(setImagePaths);
  };

  // Preload images
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    const numberOfImages = Object.keys(imagePaths).length;
    Promise.all(
      Object.keys(imagePaths).map((key: string) => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.src = formatImageUrl(imagePaths[key].src);
          img.onload = () => resolve(img);
          img.onerror = reject;
        }).then((img) => {
          loadedImages.push(img);
          setProgress(Math.round((loadedImages.length / numberOfImages) * 100));

          if (loadedImages.length % 5 === 0) {
            setLoadedImages(loadedImages);
          }

          return img;
        });
      })
    ).then(setLoadedImages);
  }, [imagePaths]);

  return (
    <>
      {progress !== 100 && (
        <div className="m-auto w-[960px] mb-9">
          <div className="mb-1 text-base">Downloading Images:</div>
          <div className="w-full bg-gray-200 rounded-full">
            <div
              className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
              style={{ width: progress + "%" }}
            >
              {progress}%
            </div>
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
