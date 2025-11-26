'use client';

import React, { useMemo, useEffect } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, BackgroundVariant, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import PaperNode from './PaperNode';
import { generateMockData } from '@/lib/mock-data';
import { calculateLayout } from '@/lib/layout';

const nodeTypes = {
    paper: PaperNode,
};

const MindMapCanvas = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

    useEffect(() => {
        // Initial Data Load
        const data = generateMockData();
        const layout = calculateLayout(data);

        setNodes(layout.nodes);
        setEdges(layout.edges);
    }, [setNodes, setEdges]);

    // Update edge styles when selection changes
    useEffect(() => {
        setEdges((eds) =>
            eds.map((edge) => {
                const isConnected =
                    selectedNodeId &&
                    (edge.source === selectedNodeId || edge.target === selectedNodeId);

                return {
                    ...edge,
                    animated: isConnected ? true : false,
                    style: {
                        ...edge.style,
                        stroke: isConnected ? '#3b82f6' : '#cbd5e1', // Blue if connected, light gray if not
                        strokeWidth: isConnected ? 3 : 1,
                        opacity: selectedNodeId ? (isConnected ? 1 : 0.2) : 1, // Dim others if something is selected
                    },
                    zIndex: isConnected ? 10 : 0,
                };
            })
        );

        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                style: {
                    ...node.style,
                    opacity: selectedNodeId ? (node.id === selectedNodeId || edges.some(e => (e.source === selectedNodeId || e.target === selectedNodeId) && (e.source === node.id || e.target === node.id)) ? 1 : 0.3) : 1
                }
            }))
        );

    }, [selectedNodeId, setEdges, setNodes, edges]); // Added edges to dependency, might cause loop if not careful.
    // Actually, modifying edges inside useEffect based on edges state is risky.
    // Better approach: Compute derived edges for rendering or use a separate effect that only runs on selection change,
    // but we need the latest edges list.
    // Let's simplify: Just update styles in the render pass or use a specific handler.
    // React Flow recommends updating the state.

    const onNodeClick = (_: React.MouseEvent, node: { id: string }) => {
        setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
    };

    const onPaneClick = () => {
        setSelectedNodeId(null);
    };

    return (
        <div className="w-full h-screen bg-slate-50 dark:bg-slate-950">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
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
