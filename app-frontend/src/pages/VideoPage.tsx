import React, { useEffect, useState } from "react"
import VideoStream from "../components/VideoStream"
import { getImages } from "../services/imageService"
import { GetImagesDTO } from "../types/Box"
import { HTML5Backend } from "react-dnd-html5-backend"
import { DndProvider } from "react-dnd"
import { useFetchImages } from "../hooks/fetchImages"
import { getSortedKeys } from "../services/getSortedKeys"

const VideoPage: React.FC = () => {
  const [imagePaths, setImagePaths] = useState<GetImagesDTO>({})
  const [progress, setProgress] = useState(0)
  const [frameIndex, setFrameIndex] = useState(0)
  const [totalImages, setTotalImages] = useState(1)

  const limit = 100

  // eslint-disable-next-line no-shadow
  const updateFrameIndex = (frameIndex: number) => {
    setFrameIndex(frameIndex)
  }

  useEffect(() => {
    const fetchData = async () => {
      const result = await getSortedKeys()
      const sortedKeys = result.data.sortedKeys
      sortedKeys.forEach((key: string) => {
        imagePaths[key] = null
      })
      setTotalImages(sortedKeys.length)
    }
    fetchData()
  }, [imagePaths])
  //TODO: Check if this effect dependency is necessary

  useFetchImages({
    limit: 30,
    concurrentFetches: 20,
    delay: 2,
    totalEntries: 100,
    updateState: ({ data, numberOfEntries }) => {
      setImagePaths((prev) => {
        const newPaths = { ...prev }

        Object.keys(data).forEach((key) => {
          newPaths[key] = data[key]
        })

        return newPaths
      })
      setTotalImages(numberOfEntries)
    }
  })


  useEffect(() => {

    if (totalImages === 0) return
    const completeImages = Object.keys(imagePaths).filter((key) => {
      return imagePaths[key] !== null
    })

    const progressRate = Math.round(

      (completeImages.length / totalImages) * 100
    )

    setProgress(progressRate)

  }, [totalImages, imagePaths])

  const refreshImages = async () => {
    await getImages({ offset: frameIndex, limit }).then((response) => response.data)
    return false
  }

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
  )
}

export default VideoPage
