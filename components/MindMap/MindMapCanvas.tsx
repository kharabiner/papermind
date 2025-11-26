'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, BackgroundVariant, Node, Edge, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Download, Upload, Plus, FileJson } from 'lucide-react';

import PaperNode from './PaperNode';
import CategoryNode from './CategoryNode';
import TopicNode from './TopicNode';
import AddPaperModal from './AddPaperModal';
import { generateMockData } from '@/lib/mock-data';
import { calculateLayout } from '@/lib/layout';
import { MindMapData, Paper, Topic } from '@/types';

const nodeTypes = {
    paper: PaperNode,
    category: CategoryNode,
    topic: TopicNode,
};

const MindMapCanvas = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Ref to track current nodes for event handlers without creating dependencies
    const nodesRef = React.useRef(nodes);
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    // App State
    const [mindMapData, setMindMapData] = useState<MindMapData>({ papers: [], citations: [], topics: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Ref to store the last known Y of each category for drag deltas
    const categoryYRefs = React.useRef<Record<string, number>>({});



    // Initial Data Load
    useEffect(() => {
        const savedData = localStorage.getItem('PAPERMIND_DATA');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setMindMapData(parsed);
            } catch (e) {
                console.error('Failed to load data from local storage', e);
                setMindMapData(generateMockData());
            }
        } else {
            setMindMapData(generateMockData());
        }
    }, []);

    // Auto-save to LocalStorage
    useEffect(() => {
        if (mindMapData.papers.length > 0) {
            // We also need to save current node positions if they differ from initial layout
            // But mindMapData might not have the latest positions if we only update it on export.
            // Let's sync positions to mindMapData before saving?
            // Actually, for auto-save to work perfectly with drag, we should update mindMapData on node drag end.
            // For now, let's just save the structure. Position persistence on drag might be too heavy if we update state on every drag.
            // Let's rely on the user explicitly exporting for perfect position saving, OR
            // we can update mindMapData periodically or on node drag stop.

            // Simple approach: Save what we have. If user wants to save positions, they are saved when we merge them back.
            // Wait, if we load from LS, we want positions.
            // So we should merge positions into mindMapData whenever nodes change? No, that causes loop.

            // Better: When saving to LS, merge current node positions.
            const updatedPapers = mindMapData.papers.map(paper => {
                const node = nodes.find(n => n.id === paper.id);
                return node ? { ...paper, position: node.position } : paper;
            });

            localStorage.setItem('PAPERMIND_DATA', JSON.stringify({ ...mindMapData, papers: updatedPapers }));
        }
    }, [mindMapData, nodes]); // Warning: nodes changes often on drag. Debouncing might be needed if performance is bad.
    // For now, let's try. If it's too slow, we can optimize.

    const handleDeletePaper = useCallback((id: string) => {
        setMindMapData(prev => {
            const newPapers = prev.papers.filter(p => p.id !== id);
            const newCitations = prev.citations.filter(c => c.sourcePaperId !== id && c.targetPaperId !== id);
            return {
                ...prev,
                papers: newPapers,
                citations: newCitations
            };
        });
        setSelectedNodeId(null);
    }, []);

    const handleResetPosition = useCallback((id: string) => {
        setMindMapData(prev => {
            // First, sync current positions from the 'nodes' state to 'mindMapData'
            // This ensures that other dragged nodes don't lose their positions when we re-calculate layout
            const papersWithCurrentPositions = prev.papers.map(p => {
                const currentNode = nodesRef.current.find(n => n.id === p.id);
                if (currentNode && currentNode.position) {
                    return { ...p, position: currentNode.position };
                }
                return p;
            });

            // Now reset the specific paper
            const updatedPapers = papersWithCurrentPositions.map(p => {
                if (p.id === id) {
                    const { position, ...rest } = p; // Remove position to trigger auto-layout
                    return rest;
                }
                return p;
            });

            return { ...prev, papers: updatedPapers };
        });
    }, []);

    // Update Layout when data changes
    useEffect(() => {
        if (mindMapData.papers.length === 0) {
            setNodes([]);
            setEdges([]);
            return;
        }
        const layout = calculateLayout(mindMapData);

        // Inject handlers
        const initializedNodes = layout.nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                onDelete: handleDeletePaper,
                onResetPosition: handleResetPosition,
                // Apply initial highlighting if needed (though usually null on load)
                isSelected: false,
                dimmed: false
            }
        }));

        setNodes(initializedNodes);
        setEdges(layout.edges);

        // Initialize refs for drag
        const refs: Record<string, number> = {};
        initializedNodes.forEach(n => {
            if (n.type === 'category') {
                refs[((n.data as unknown) as { label: string }).label] = n.position.y;
            }
        });
        categoryYRefs.current = refs;

    }, [mindMapData, setNodes, setEdges, handleDeletePaper, handleResetPosition]);

    // Apply Highlighting when selection changes (Preserve Positions)
    useEffect(() => {
        setNodes((nds) => nds.map(node => {
            const baseNode = { ...node };

            if (!selectedCategory) {
                return {
                    ...baseNode,
                    data: { ...baseNode.data, isSelected: false, dimmed: false }
                };
            }

            const isCategoryNode = node.type === 'category';
            const isPaperNode = node.type === 'paper';

            // If it's the selected category node
            if (isCategoryNode && node.data.label === selectedCategory) {
                return { ...baseNode, data: { ...baseNode.data, isSelected: true, dimmed: false } };
            }

            // If it's a paper belonging to the selected category (Primary or Secondary)
            if (isPaperNode && node.data.categories && (node.data.categories as string[]).includes(selectedCategory)) {
                return { ...baseNode, data: { ...baseNode.data, dimmed: false } };
            }

            // Otherwise dim it
            return { ...baseNode, data: { ...baseNode.data, isSelected: false, dimmed: true } };
        }));
    }, [selectedCategory, setNodes]);

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

    const onNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
        if (node.type === 'category') {
            const categoryLabel = node.data.label as string;
            const newY = node.position.y;

            // Get the last known Y from ref, or default to current if missing
            // We must ensure we have a valid 'old' position to calculate delta
            const oldY = categoryYRefs.current[categoryLabel];

            // If we don't have a record, we can't calculate delta properly on first drag frame.
            // But we initialized it in useEffect.

            if (oldY !== undefined) {
                const deltaY = newY - oldY;

                if (deltaY !== 0) {
                    setNodes((nds) => nds.map((n) => {
                        // If it's the dragged category, we MUST return the 'node' passed in the callback
                        // because it contains the updated position from the drag event.
                        // If we return 'n' (from state), it might be stale or cause jitter.
                        if (n.id === node.id) {
                            return node;
                        }

                        // Move papers in this category (Primary or Secondary)
                        // Note: If a paper belongs to multiple categories, dragging ANY of them will move the paper.
                        // This might be desired or not. If we only want PRIMARY category to move it, check categories[0].
                        // User said: "One paper, one card". If I drag "AI" and paper is "AI, Neuro", it should move.
                        // If I drag "Neuro" and paper is "AI, Neuro" (but visually in AI row), should it move?
                        // If it moves, it might detach from its visual row.
                        // So we should ONLY move it if the dragged category is its PRIMARY category (visual row).
                        if (n.type === 'paper' && (n.data.categories as string[])?.[0] === categoryLabel) {
                            return {
                                ...n,
                                position: {
                                    ...n.position,
                                    y: n.position.y + deltaY
                                }
                            };
                        }
                        return n;
                    }));

                    // Update ref to new position
                    categoryYRefs.current[categoryLabel] = newY;
                }
            } else {
                // Should not happen if initialized, but just in case, set it
                categoryYRefs.current[categoryLabel] = newY;
            }
        }
    }, []);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        if (node.type === 'category') {
            const category = node.data.label as string;
            setSelectedCategory(prev => prev === category ? null : category);
            setSelectedNodeId(null); // Clear paper selection when category is clicked
        } else {
            setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
        }
    }, [selectedNodeId]);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
        setSelectedCategory(null);
    }, []);

    // --- Actions ---

    const handleExport = () => {
        // Merge current node positions into the data
        const updatedPapers = mindMapData.papers.map(paper => {
            const node = nodes.find(n => n.id === paper.id);
            if (node) {
                return { ...paper, position: node.position };
            }
            return paper;
        });

        const dataToSave = { ...mindMapData, papers: updatedPapers };

        const dataStr = JSON.stringify(dataToSave, null, 2);
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
                onNodeDrag={onNodeDrag}
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
                    <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                                localStorage.removeItem('PAPERMIND_DATA');
                                window.location.reload();
                            }
                        }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm font-medium transition-colors"
                    >
                        Reset
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
