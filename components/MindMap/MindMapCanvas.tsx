'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, BackgroundVariant, Node, Edge, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Download, Upload, Plus, FileJson, Search, X } from 'lucide-react';

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

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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
            const updatedPapers = mindMapData.papers.map(paper => {
                const node = nodes.find(n => n.id === paper.id);
                return node ? { ...paper, position: node.position } : paper;
            });

            const categoryPositions: Record<string, { x: number; y: number }> = {};
            nodes.forEach(node => {
                if (node.type === 'category') {
                    categoryPositions[(node.data.label as string)] = node.position;
                }
            });

            localStorage.setItem('PAPERMIND_DATA', JSON.stringify({
                ...mindMapData,
                papers: updatedPapers,
                categoryPositions
            }));
        }
    }, [mindMapData, nodes]);

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
            const papersWithCurrentPositions = prev.papers.map(p => {
                const currentNode = nodesRef.current.find(n => n.id === p.id);
                if (currentNode && currentNode.position) {
                    return { ...p, position: currentNode.position };
                }
                return p;
            });

            const updatedPapers = papersWithCurrentPositions.map(p => {
                if (p.id === id) {
                    const { position, ...rest } = p;
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

        const initializedNodes = layout.nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                onDelete: handleDeletePaper,
                onResetPosition: handleResetPosition,
                isSelected: false,
                dimmed: false
            }
        }));

        setNodes(initializedNodes);
        setEdges(layout.edges);

        const refs: Record<string, number> = {};
        initializedNodes.forEach(n => {
            if (n.type === 'category') {
                refs[((n.data as unknown) as { label: string }).label] = n.position.y;
            }
        });
        categoryYRefs.current = refs;
    }, [mindMapData, setNodes, setEdges, handleDeletePaper, handleResetPosition]);

    // Auto-center categories when node measurements are available (Post-render adjustment)
    useEffect(() => {
        const hasMeasurements = nodes.some(n => n.measured?.height);
        if (!hasMeasurements) return;

        setNodes(currentNodes => {
            let hasChanges = false;
            const newNodes = [...currentNodes];

            const categoryPapers = new Map<string, Node[]>();
            currentNodes.forEach(n => {
                if (n.type === 'paper') {
                    const cat = (n.data.categories as string[])?.[0];
                    if (cat) {
                        if (!categoryPapers.has(cat)) categoryPapers.set(cat, []);
                        categoryPapers.get(cat)!.push(n);
                    }
                }
            });

            currentNodes.forEach((node, index) => {
                if (node.type === 'category') {
                    const categoryLabel = node.data.label as string;
                    const papers = categoryPapers.get(categoryLabel);

                    if (papers && papers.length > 0) {
                        let minTop = Infinity;
                        let maxBottom = -Infinity;
                        let allMeasured = true;

                        papers.forEach(p => {
                            if (!p.measured?.height) {
                                allMeasured = false;
                                return;
                            }
                            if (p.position.y < minTop) minTop = p.position.y;
                            if (p.position.y + p.measured.height > maxBottom) maxBottom = p.position.y + p.measured.height;
                        });

                        if (allMeasured) {
                            const categoryHeight = node.measured?.height || 40;
                            const targetY = (minTop + maxBottom) / 2 - (categoryHeight / 2) + 20;

                            if (Math.abs(node.position.y - targetY) > 1) {
                                newNodes[index] = {
                                    ...node,
                                    position: { ...node.position, y: targetY }
                                };
                                categoryYRefs.current[categoryLabel] = targetY;
                                hasChanges = true;
                            }
                        }
                    }
                }
            });

            return hasChanges ? newNodes : currentNodes;
        });
    }, [nodes.length, nodes.map(n => n.measured?.height).join(',')]);

    // Apply Highlighting when selection changes (Preserve Positions)
    useEffect(() => {
        setNodes((nds) => nds.map(node => {
            const baseNode = { ...node };

            // 1. Search Filtering (Highest Priority)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();

                if (node.type === 'category') {
                    return { ...baseNode, data: { ...baseNode.data, isSelected: false, dimmed: false } };
                }

                if (node.type === 'paper') {
                    const paper = node.data as unknown as Paper;
                    const matchTitle = paper.title.toLowerCase().includes(query);
                    const matchAuthors = paper.authors.some(a => a.toLowerCase().includes(query));
                    const matchTopic = paper.topic.toLowerCase().includes(query);
                    const matchCategory = paper.categories?.some(c => c.toLowerCase().includes(query));

                    if (matchTitle || matchAuthors || matchTopic || matchCategory) {
                        return { ...baseNode, data: { ...baseNode.data, dimmed: false } };
                    } else {
                        return { ...baseNode, data: { ...baseNode.data, dimmed: true } };
                    }
                }

                return baseNode;
            }

            // 2. Category Selection (Existing Logic)
            if (!selectedCategory) {
                return {
                    ...baseNode,
                    data: { ...baseNode.data, isSelected: false, dimmed: false }
                };
            }

            const isCategoryNode = node.type === 'category';
            const isPaperNode = node.type === 'paper';

            if (isCategoryNode && node.data.label === selectedCategory) {
                return { ...baseNode, data: { ...baseNode.data, isSelected: true, dimmed: false } };
            }

            if (isPaperNode && node.data.categories && (node.data.categories as string[]).includes(selectedCategory)) {
                return { ...baseNode, data: { ...baseNode.data, dimmed: false } };
            }

            return { ...baseNode, data: { ...baseNode.data, isSelected: false, dimmed: true } };
        }));
    }, [selectedCategory, searchQuery, setNodes]);

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
            const oldY = categoryYRefs.current[categoryLabel];

            if (oldY !== undefined) {
                const deltaY = newY - oldY;
                if (deltaY !== 0) {
                    setNodes((nds) => nds.map((n) => {
                        if (n.id === node.id) return node;
                        if (n.type === 'paper' && (n.data.categories as string[])?.[0] === categoryLabel) {
                            return { ...n, position: { ...n.position, y: n.position.y + deltaY } };
                        }
                        return n;
                    }));
                    categoryYRefs.current[categoryLabel] = newY;
                }
            } else {
                categoryYRefs.current[categoryLabel] = newY;
            }
        }
        else if (node.type === 'paper') {
            const primaryCategory = (node.data.categories as string[])?.[0];
            if (!primaryCategory) return;

            setNodes((nds) => {
                const categoryPapers = nds.filter(n =>
                    n.type === 'paper' &&
                    (n.data.categories as string[])?.[0] === primaryCategory &&
                    n.id !== node.id
                );

                const allPapers = [...categoryPapers, node];

                if (allPapers.length === 0) return nds;

                let minTop = Infinity;
                let maxBottom = -Infinity;

                allPapers.forEach(p => {
                    const h = p.measured?.height || 200;
                    if (p.position.y < minTop) minTop = p.position.y;
                    if (p.position.y + h > maxBottom) maxBottom = p.position.y + h;
                });

                const boundingBoxCenterY = (minTop + maxBottom) / 2;
                const categoryHeight = 40;
                const targetY = boundingBoxCenterY - (categoryHeight / 2) + 20;

                return nds.map(n => {
                    if (n.id === node.id) return node;

                    if (n.type === 'category' && n.data.label === primaryCategory) {
                        categoryYRefs.current[primaryCategory] = targetY;
                        return { ...n, position: { ...n.position, y: targetY } };
                    }
                    return n;
                });
            });
        }
    }, []);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        if (node.type === 'category') {
            const category = node.data.label as string;
            setSelectedCategory(prev => prev === category ? null : category);
            setSelectedNodeId(null);
        } else {
            setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
        }
    }, [selectedNodeId]);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
        setSelectedCategory(null);
    }, []);

    const handleExport = () => {
        const updatedPapers = mindMapData.papers.map(paper => {
            const node = nodes.find(n => n.id === paper.id);
            if (node) {
                return { ...paper, position: node.position };
            }
            return paper;
        });

        const categoryPositions: Record<string, { x: number; y: number }> = {};
        nodes.forEach(node => {
            if (node.type === 'category') {
                categoryPositions[(node.data.label as string)] = node.position;
            }
        });

        const dataToSave = { ...mindMapData, papers: updatedPapers, categoryPositions };

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

                <Panel position="top-right" className="bg-white dark:bg-slate-900 p-2 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex gap-2 items-center">
                    <div className={`flex items-center transition-all duration-300 overflow-hidden ${isSearchOpen ? 'w-64 mr-2' : 'w-0'}`}>
                        <input
                            type="text"
                            placeholder="Search papers..."
                            className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <button
                        onClick={() => {
                            setIsSearchOpen(!isSearchOpen);
                            if (isSearchOpen) setSearchQuery('');
                        }}
                        className={`p-2 rounded-md transition-colors ${isSearchOpen || searchQuery ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                        title="Search"
                    >
                        {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                    </button>

                    <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1 h-6" />

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        title="Add Paper"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                    <label className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md cursor-pointer transition-colors" title="Import JSON">
                        <Upload className="w-5 h-5" />
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                    <button
                        onClick={handleExport}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                        title="Export JSON"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                                localStorage.removeItem('PAPERMIND_DATA');
                                window.location.reload();
                            }
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md font-bold transition-colors w-9 h-9 flex items-center justify-center"
                        title="Reset All Data"
                    >
                        R
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
