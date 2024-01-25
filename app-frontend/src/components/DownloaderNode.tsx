import { useEffect, useState } from "react"
import { Handle, Position } from "reactflow"
import { DownloaderInstance } from "./Dataflow"

const DownloaderNodeComponent = ({ data }: { data: DownloaderInstance }) => {
    const [flash, setFlash] = useState(false)

    useEffect(() => {
        if (data.framesProduced) {
            setFlash(true)
            setTimeout(() => setFlash(false), 1000)
        }
    }, [data.framesProduced])

    const flashStyle = flash ? "scale-110" : "scale-100"
    const borderColor = "2px solid rgba(70, 130, 180, 1)"
    const backgroundColor = flash ? "rgba(216, 235, 245, 1)" : "rgb(255, 255, 255, 1)"
    const statusColor = data.ready ? "bg-green-500" : "bg-yellow-500"

    return (
        <div style={{ animation: "slideInFromRight 0.5s ease-out", position: "relative" }}>
            <div className={`absolute inset-0 rounded-lg transition-transform duration-700 ${flashStyle}`} style={{ border: borderColor, background: backgroundColor }}></div>
            <Handle type="target" position={Position.Left} style={{ background: "#555" }} />
            <div className="p-4 shadow rounded-lg relative z-10">
                <div className="flex items-center mb-2">
                    <div className={`w-5 h-5 rounded-full ${statusColor}`}></div>
                    <strong className="ml-2">{data.id.split("-").pop()}</strong>
                </div>
                <p className="mb-1">Frames produced: <span className="font-bold">{data.framesProduced}</span></p>
            </div>
            <Handle type="source" position={Position.Right} style={{ background: "#555" }} />
        </div>
    )
}

export default DownloaderNodeComponent
