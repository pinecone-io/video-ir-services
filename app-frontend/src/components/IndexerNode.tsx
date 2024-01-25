import { useEffect, useState } from "react"
import { Handle, Position } from "reactflow"
import { IndexerInstance } from "./Dataflow"

const IndexerNodeComponent = ({ data }: { data: IndexerInstance }) => {
    const [flash, setFlash] = useState(false)
    const [numEmbeddings, setNumEmbeddings] = useState<number>(0)

    useEffect(() => {
        if (data.embeddingsProcessed && data.embeddingsProcessed > numEmbeddings) {
            setFlash(true)
            setTimeout(() => setFlash(false), 1000)
            setNumEmbeddings(data.embeddingsProcessed)
        }
    }, [data, numEmbeddings])

    const flashStyle = flash ? "scale-110" : "scale-100"
    const flashBackground = flash ? "rgba(204, 255, 204, 0.8)" : "rgb(255, 255, 255, 0.8)"

    return (
        <div style={{ animation: "slideInFromRight 0.5s ease-out", position: "relative" }}>
            <div className={`absolute inset-0 rounded-lg transition-transform duration-700 ${flashStyle}`} style={{
                background: flashBackground,
                border: "1px solid rgba(152, 251, 152, 1)"
            }}></div>
            <Handle type="target" position={Position.Left} style={{ background: "#555" }} />
            <div className="p-4 shadow rounded-lg relative z-10">
                <div className="flex items-center mb-2">
                    <div className={`w-5 h-5 rounded-full ${data.ready ? "bg-green-500" : "bg-yellow-500"}`}></div>
                    <strong className="ml-2">{data.id.split("-").pop()}</strong>
                </div>
                <p className="mb-1">Embeddings Processed: <span className="font-bold">{data.embeddingsProcessed}</span></p>
                <p className="mb-1">Frames Processed: <span className="font-bold">{data.framesProcessed}</span></p>
            </div>
            <Handle type="source" position={Position.Right} style={{ background: "#555" }} />
        </div>
    )
}

export default IndexerNodeComponent