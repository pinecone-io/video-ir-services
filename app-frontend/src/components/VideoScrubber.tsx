import React, { useState, useEffect } from "react"

interface VideoScrubberProps {
    videoRef: React.RefObject<HTMLVideoElement>;
}

const VideoScrubber: React.FC<VideoScrubberProps> = ({ videoRef }) => {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const updateProgress = () => {
            const currentTime = video.currentTime
            const duration = video.duration
            setProgress((currentTime / duration) * 100)
        }

        video.addEventListener("timeupdate", updateProgress)

        return () => {
            video.removeEventListener("timeupdate", updateProgress)
        }
    }, [videoRef])

    const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current
        if (!video) return

        const newProgress = parseFloat(e.target.value)
        setProgress(newProgress)

        const newTime = (newProgress / 100) * video.duration
        video.currentTime = newTime
    }

    return (
        <input
            type="range"
            min="0"
            max="100"
            step="0.01"
            value={progress}
            onChange={handleScrub}
            className="w-full"
        />
    )
}

export default VideoScrubber
