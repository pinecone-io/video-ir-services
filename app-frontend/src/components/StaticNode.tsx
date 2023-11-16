import { Handle, Position } from 'reactflow';

const StaticNodeComponent = ({ data }: { data: { topic: string } }) => {
    return (
        <div>
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <div className="p-4 bg-white shadow rounded-lg">
                <div className="flex items-center mb-2">
                    <strong className="ml-2">{data.topic}</strong>
                </div>
                {/* Add more data here */}
            </div>
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </div>
    );
};

export default StaticNodeComponent;