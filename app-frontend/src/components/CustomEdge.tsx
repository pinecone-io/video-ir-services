import { useEffect, useState } from "react"
import { getBezierPath, EdgeProps } from "reactflow"

const CustomEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
}: EdgeProps) => {

    const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })

    // Existing logic and effects
    const [value, setValue] = useState(0)
    const [flash, setFlash] = useState(false)

    useEffect(() => {
        if (data.active && data.active > value) {
            setFlash(true)
            setTimeout(() => setFlash(false), 2000)
            setValue(data.active)
        }
    }, [data, value])

    const color = data.type == "indexer" ? "green" : "blue"
    const circleColor = data.type == "indexer" ? "rgb(0, 255, 0)" : "rgb(0, 191, 255)"

    const lineStyle = {
        stroke: flash ? color : "black",
        strokeWidth: flash ? "2" : "0.5",
        fill: "none",
        transition: "stroke-width stroke 0.3s ease-in-out"
    }

    return (
        <g>
            <path id={id} d={path} style={lineStyle} />
            {path && (
                <circle r={flash ? 7 : 1} fill={flash ? circleColor : "blue"}>
                    <animateMotion dur="2s" repeatCount="indefinite">
                        <mpath href={`#${id}`} />
                    </animateMotion>
                </circle>
            )}
        </g>
    )
}

export default CustomEdge