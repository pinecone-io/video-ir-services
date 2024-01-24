import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
    Edge,
    MiniMap,
    Node,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow
} from 'reactflow';

import 'reactflow/dist/style.css';
import CustomEdge from './CustomEdge';
import DownloaderNode from './DownloaderNode';
import IndexerNodeComponent from './IndexerNode';
import StaticNodeComponent from './StaticNode';

export interface IndexerInstance {
    id: string;
    ready: boolean;
    embeddingsProcessed: number;
    framesProcessed: number;
}

export interface DownloaderInstance {
    id: string;
    ready: boolean;
    framesProduced: number;
}


interface NodeData {
    id: string;
    label?: string;
    ready?: boolean;
    embeddingsProcessed?: number;
    framesProcessed?: number;
    framesProduced?: number;
    topic?: string;
}

interface DataflowProps {
    indexerInstances: IndexerInstance[];
    downloaderInstances: DownloaderInstance[]
}

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    return { nodes, edges };
};

const nodeTypes = { indexerNode: IndexerNodeComponent, staticNode: StaticNodeComponent, downloaderNode: DownloaderNode }
const edgeTypes = { 'custom-edge': CustomEdge }



const DataflowC: React.FC<DataflowProps> = ({ indexerInstances, downloaderInstances }) => {
    useEffect(() => {
        // 
    }, [indexerInstances, downloaderInstances]);

    const initialNodes: Node<NodeData>[] = [
    ];

    const initialEdges: Edge[] = []


    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);



    useEffect(() => {
        const downloaderNodesPerRow = 2;
        const indexerNodesPerRow = 5;
        const xOffsetDownloader = -325;
        const xOffsetIndexer = 775;

        const checkCollision = (position: { x: number, y: number }) => {
            return nodes.some(node => node.position.x === position.x && node.position.y === position.y);
        };

        const getNonCollidingPosition = (position: { x: number, y: number }) => {
            while (checkCollision(position)) {
                position.x += 250;
            }
            return position;
        };

        const createNode = (instance: IndexerInstance | DownloaderInstance, type: string, xOffset: number, nodesPerRow: number, index: number) => {
            const rowIndex = Math.floor(index / nodesPerRow);
            const columnIndex = index % nodesPerRow;
            const previousNode = nodes.find(node => node.id === instance.id);
            const position = previousNode ? previousNode.position : getNonCollidingPosition({ x: xOffset + columnIndex * 300, y: rowIndex * 250 });

            return {
                id: instance.id,
                position: position,
                type: type,
                data: instance,
            };
        };

        const createEdge = (source: string, target: string, animated: boolean = false, data: unknown = {}) => {
            return {
                id: `edge-${source}-to-${target}`,
                source: source,
                target: target,
                animated: animated,
                type: 'custom-edge',
                data: data,
            };
        };

        const newNodes: Node<NodeData>[] = [
            ...downloaderInstances.filter((instance => instance.id)).map((instance, index) => createNode(instance, 'downloaderNode', xOffsetDownloader, downloaderNodesPerRow, index)),
            {
                id: 'kafka-frame-producer',
                type: 'staticNode',
                position: { x: 350, y: 300 },
                data: {
                    id: 'kafka-frame-producer',
                    topic: 'Kafka Frame Producer',
                },
            },
            ...indexerInstances.filter((instance => instance.id)).map((instance, index) => createNode(instance, 'indexerNode', xOffsetIndexer, indexerNodesPerRow, index)),
            {
                id: 'pinecone',
                type: 'staticNode',
                position: { x: 2800, y: 300 },
                data: {
                    id: 'pinecone',
                    topic: 'Pinecone',
                }
            }
        ];

        const newEdges: Edge[] = [
            ...indexerInstances.map((instance) => createEdge('kafka-frame-producer', instance.id, false, { active: instance.framesProcessed, id: instance.id, type: 'indexer' })),
            ...indexerInstances.map((instance) => createEdge(instance.id, 'pinecone', false, { active: instance.framesProcessed, id: instance.id, type: 'indexer' })),
            ...downloaderInstances.map((instance) => createEdge(instance.id, 'kafka-frame-producer', false, { active: instance.framesProduced, type: 'downloader' })),
        ];

        if (JSON.stringify(newNodes) !== JSON.stringify(nodes)) {
            setNodes(newNodes);
        }
        if (JSON.stringify(newEdges) !== JSON.stringify(edges)) {
            setEdges(newEdges);
        }
    }, [indexerInstances, downloaderInstances, nodes, edges, setEdges, setNodes]);


    const { fitView } = useReactFlow();


    useCallback(() => {
        const layouted = getLayoutedElements(nodes, edges);

        setNodes([...layouted.nodes]);
        setEdges([...layouted.edges]);

        window.requestAnimationFrame(() => {
            fitView();
        });
    }, [nodes, edges, fitView, setNodes, setEdges]);

    if ((!indexerInstances || indexerInstances.length === 0) && (!downloaderInstances || downloaderInstances.length === 0)) {
        return (
            <div className="flex justify-center">
                <div className="p-5 border border-gray-300 rounded bg-gray-100 text-center">
                    System idle
                </div>
            </div>
        );
    }

    return (

        <ReactFlow
            nodes={nodes.map(node => ({ ...node, position: { ...node.position, y: node.position.y - 170 } }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
        >
            <MiniMap nodeStrokeWidth={3} />
        </ReactFlow>
    );
}

export default function Dataflow({ indexerInstances, downloaderInstances }: { indexerInstances: IndexerInstance[], downloaderInstances: DownloaderInstance[] }) {
    return <ReactFlowProvider>
        <DataflowC indexerInstances={indexerInstances} downloaderInstances={downloaderInstances} />
    </ReactFlowProvider>
}
