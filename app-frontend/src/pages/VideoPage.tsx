import React, { useEffect, useState } from "react";
import VideoStream from "../components/VideoStream";
import { getImages } from "../services/imageService";
import { formatImageUrl } from "../utils/formatImageUrl";
import { GetImagesDTO } from "../types/Box";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

const VideoPage: React.FC = () => {
  const [imagePaths, setImagePaths] = useState<GetImagesDTO>({});
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [progress, setProgress] = useState(0);

  // Fetch all image paths from the server
  useEffect(() => {
    getImages()
      .then((response) => response.data)
      .then(setImagePaths);
  }, []);

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
            <VideoStream imagePaths={imagePaths} loadedImages={loadedImages} />
          </div>
        </div>
      </DndProvider>
    </>
  );
};

export default VideoPage;
