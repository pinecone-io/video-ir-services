import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    useReactFlow,
} from 'reactflow';

import CustomNodeComponent from './CustomNode';
import StaticNodeComponent from './StaticNode';

export interface IndexerInstance {
    id: string;
    ready: boolean;
    embeddingsProcessed: number;
    framesProcessed: number;
}

import 'reactflow/dist/style.css';


interface NodeData {
    id: string;
    label?: string;
    ready?: boolean;
    embeddingsProcessed?: number;
    framesProcessed?: number;
    topic?: string;
}

interface DataflowProps {
    indexerInstances: IndexerInstance[];
}

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    return { nodes, edges };
};

const nodeTypes = { indexerNode: CustomNodeComponent, staticNode: StaticNodeComponent }

const DataflowC: React.FC<DataflowProps> = ({ indexerInstances }) => {
    useEffect(() => {
        // console.log('indexerInstances changed', indexerInstances);
    }, [indexerInstances]);
    // const nodeTypes = useMemo(() => ({ indexerNode: CustomNodeComponent, staticNode: StaticNodeComponent }), []);


    const nodesPerRow = 5; // Adjust this to change the number of nodes per row

    const initialNodes: Node<NodeData>[] = [...indexerInstances.map((instance, index) => {
        const rowIndex = Math.floor(index / nodesPerRow);
        const columnIndex = index % nodesPerRow;

        // Add an offset to the x-position in every other row
        const xOffset = rowIndex % 2 === 0 ? 0 : 125; // Adjust this to change the offset

        return {
            id: instance.id,
            position: { x: xOffset + columnIndex * 250, y: rowIndex * 150 },
            type: 'indexerNode',
            data: {
                id: instance.id,
                label: instance.id.split("-").pop(),
                ready: instance.ready,
                embeddingsProcessed: instance.embeddingsProcessed,
                framesProcessed: instance.framesProcessed,
            },
        };
    }), {
        id: 'kafka-frame-producer',
        type: 'staticNode',
        position: { x: 100, y: 100 },
        data: {
            id: 'kafka-frame-producer',
            topic: '!!!Kafka Frame Producer',
        }
    },
    {
        id: 'pinecone',
        type: 'staticNode',
        position: { x: 100, y: 0 },
        data: {
            id: 'pinecone',
            topic: 'Pinecone',
        }
    }
    ];

    const initialEdges: Edge[] = indexerInstances.map((instance) => {
        return {
            id: `edge-${instance.id}`,
            source: 'kafka-frame-producer',
            target: instance.id,
            animated: true,
        }
    })


    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);



    useEffect(() => {
        const nodesPerRow = 5; // Adjust this to change the number of nodes per row

        const newNodes: Node<NodeData>[] = [...indexerInstances.map((instance, index) => {
            const rowIndex = Math.floor(index / nodesPerRow);
            const columnIndex = index % nodesPerRow;

            // Add an offset to the x-position in every other row
            const xOffset = rowIndex % 2 === 0 ? 0 : 125; // Adjust this to change the offset

            // Find the previous node with the same id
            const previousNode = nodes.find(node => node.id === instance.id);

            // If the node already exists, use its previous position
            const position = previousNode ? previousNode.position : { x: xOffset + columnIndex * 250, y: rowIndex * 150 };

            return {
                id: instance.id,
                position: position,
                type: 'indexerNode',
                data: {
                    id: instance.id,
                    label: instance.id.split("-").pop(),
                    ready: instance.ready,
                    embeddingsProcessed: instance.embeddingsProcessed,
                    framesProcessed: instance.framesProcessed,
                },
            };
        }), {
            id: 'kafka-frame-producer',
            type: 'staticNode',
            position: { x: -300, y: 300 },
            data: {
                id: 'kafka-frame-producer',
                topic: 'Kafka Frame Producer',
            },

        },
        {
            id: 'pinecone',
            type: 'staticNode',
            position: { x: 1400, y: 300 },
            data: {
                id: 'pinecone',
                topic: 'Pinecone',
            }
        }];

        let newEdges: Edge[] = indexerInstances.map((instance) => {
            return {
                id: `edge-${instance.id}`,
                source: 'kafka-frame-producer',
                target: instance.id,
                animated: true,
            }
        });

        newEdges = [...newEdges, ...indexerInstances.map((instance) => {
            return {
                id: `edge-${instance.id}`,
                source: instance.id,
                target: 'pinecone',
                animated: true,
            }
        })]

        // Only update state if indexerInstances has changed
        if (JSON.stringify(newNodes) !== JSON.stringify(nodes)) {
            setNodes(newNodes);
        }
        if (JSON.stringify(newEdges) !== JSON.stringify(edges)) {
            setEdges(newEdges);
        }
    }, [indexerInstances, nodes, edges]);


    const { fitView } = useReactFlow();


    useCallback(() => {
        const layouted = getLayoutedElements(nodes, edges);

        setNodes([...layouted.nodes]);
        setEdges([...layouted.edges]);

        window.requestAnimationFrame(() => {
            fitView();
        });
    }, [nodes, edges, fitView, setNodes, setEdges]);

    if (!indexerInstances || indexerInstances.length === 0) {
        return <div>No data to display</div>;
    }

    return (

        <ReactFlow
            nodes={nodes}
            edges={edges}

            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
        />
    );
}

export default function Dataflow({ indexerInstances }: { indexerInstances: IndexerInstance[] }) {
    return <ReactFlowProvider>
        <DataflowC indexerInstances={indexerInstances} />
    </ReactFlowProvider>
}
