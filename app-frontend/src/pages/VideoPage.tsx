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

  // Fetch all image paths from the server
  useEffect(() => {
    getImages()
      .then((response) => response.data)
      .then(setImagePaths);
  }, []);

  // Preload images
  useEffect(() => {
    Promise.all(
      Object.keys(imagePaths).map((key: string) => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.src = formatImageUrl(imagePaths[key].src);
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
      })
    ).then(setLoadedImages);
  }, [imagePaths]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-white text-black w-full">
        <header className="border-b-1 border-color-primary-300 p-heading mb-mb42">
          <div className="flex justify-between">
            <img src="images/pinecone_logo.png" alt="" />
            <a
              href="https://www.pinecone.io/"
              target="_blank"
              className="opacity-80 flex text-base15 font-semibold items-center"
            >
              About Us
            </a>
          </div>
        </header>
        <div className="flex justify-center mb-mb42">
          <h1 className="text-lg30 text-primary-100 text-center font-bold">
            Video Image Recognition
          </h1>
        </div>

        <div className="flex flex-wrap justify-center">
          <VideoStream imagePaths={imagePaths} loadedImages={loadedImages} />
        </div>
      </div>
    </DndProvider>
  );
};

export default VideoPage;
