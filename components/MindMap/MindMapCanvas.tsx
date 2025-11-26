'use client';

import React, { useMemo, useEffect } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import PaperNode from './PaperNode';
import { generateMockData } from '@/lib/mock-data';
import { calculateLayout } from '@/lib/layout';

const nodeTypes = {
    paper: PaperNode,
};

const MindMapCanvas = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        // Initial Data Load
        const data = generateMockData();
        const layout = calculateLayout(data);

        setNodes(layout.nodes);
        setEdges(layout.edges);
    }, [setNodes, setEdges]);

    return (
        <div className="w-full h-screen bg-slate-50 dark:bg-slate-950">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
                maxZoom={4}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#64748b', strokeWidth: 2 },
                }}
            >
                <Background color="#94a3b8" gap={20} variant={BackgroundVariant.Dots} />
                <Controls />
            </ReactFlow>
        </div>
    );
};

export default MindMapCanvas;
