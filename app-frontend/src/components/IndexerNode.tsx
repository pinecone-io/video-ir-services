import React, { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { IndexerInstance } from './Dataflow';


const IndexerNodeComponent = ({ data }: { data: IndexerInstance }) => {
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        setFlash(true);
        setTimeout(() => setFlash(false), 1000);
    }, [data.embeddingsProcessed]);

    return (
        <div style={{ animation: 'slideInFromRight 0.5s ease-out', position: 'relative' }}>
            <div className={`absolute inset-0 rounded-lg transition-transform duration-700 ${flash ? 'scale-110' : 'scale-100'}`} style={{ background: flash ? 'rgba(152, 251, 152, 0.8)' : 'rgb(255, 255, 255, 0.8)', filter: 'blur(2px)' }}></div>
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <div className="p-4 shadow rounded-lg relative z-10">
                <div className="flex items-center mb-2">
                    <div className={`w-5 h-5 rounded-full ${data.ready ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <strong className="ml-2">{data.id.split("-").pop()}</strong>
                </div>
                <p className="mb-1">Embeddings Processed: <span className="font-bold">{data.embeddingsProcessed}</span></p>
                <p className="mb-1">Frames Processed: <span className="font-bold">{data.framesProcessed}</span></p>
                {/* Add more data here */}
            </div>
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </div>
    );
};

export default IndexerNodeComponent;