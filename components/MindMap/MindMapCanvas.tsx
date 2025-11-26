'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, BackgroundVariant, Node, Edge, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Download, Upload, Plus, FileJson } from 'lucide-react';

import PaperNode from './PaperNode';
import AddPaperModal from './AddPaperModal';
import { generateMockData } from '@/lib/mock-data';
import { calculateLayout } from '@/lib/layout';
import { MindMapData, Paper, Topic } from '@/types';

const nodeTypes = {
    paper: PaperNode,
};

const MindMapCanvas = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // App State
    const [mindMapData, setMindMapData] = useState<MindMapData>({ papers: [], citations: [], topics: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Initial Data Load
    useEffect(() => {
        const data = generateMockData();
        setMindMapData(data);
    }, []);

    // Update Layout when data changes
    useEffect(() => {
        if (mindMapData.papers.length === 0) return;
        const layout = calculateLayout(mindMapData);
        setNodes(layout.nodes);
        setEdges(layout.edges);
    }, [mindMapData, setNodes, setEdges]);

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
                        stroke: isConnected ? '#3b82f6' : '#cbd5e1',
                        strokeWidth: isConnected ? 3 : 1,
                        opacity: selectedNodeId ? (isConnected ? 1 : 0.2) : 1,
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
    }, [selectedNodeId, setEdges, setNodes]);

    const onNodeClick = (_: React.MouseEvent, node: { id: string }) => {
        setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
    };

    const onPaneClick = () => {
        setSelectedNodeId(null);
    };

    // --- Actions ---

    const handleExport = () => {
        const dataStr = JSON.stringify(mindMapData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `papermind_data_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedData = JSON.parse(content) as MindMapData;
                // Basic validation
                if (Array.isArray(parsedData.papers) && Array.isArray(parsedData.topics)) {
                    setMindMapData(parsedData);
                } else {
                    alert('Invalid JSON format');
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
                alert('Failed to parse JSON file');
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    const handleAddPaper = (newPaperData: Omit<Paper, 'id'>) => {
        const newId = `p - ${Date.now()} `;
        const newPaper: Paper = { ...newPaperData, id: newId };

        setMindMapData(prev => {
            const updatedTopics = prev.topics.includes(newPaper.topic)
                ? prev.topics
                : [...prev.topics, newPaper.topic];

            return {
                ...prev,
                papers: [...prev.papers, newPaper],
                topics: updatedTopics
            };
        });
    };

    return (
        <div className="w-full h-screen bg-slate-50 dark:bg-slate-950 relative">
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

                <Panel position="top-right" className="bg-white dark:bg-slate-900 p-2 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex gap-2">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Paper
                    </button>
                    <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        Import
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </Panel>
            </ReactFlow>

            <AddPaperModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddPaper}
                existingTopics={mindMapData.topics}
            />
        </div>
    );
};

export default MindMapCanvas;
