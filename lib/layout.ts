import { Node, Edge } from '@xyflow/react';
import { MindMapData, Paper, Topic } from '@/types';

const COLUMN_WIDTH = 400;
const ROW_HEIGHT = 200;
const START_X = 100;
const START_Y = 100;

export const calculateLayout = (data: MindMapData) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const START_X = 200; // Shift right to make space for categories
    const START_Y = 50;
    const COLUMN_WIDTH = 300;
    const ROW_HEIGHT = 150;

    // Group papers by Category -> Topic
    const categoryGroups = new Map<string, Map<string, Paper[]>>();

    data.papers.forEach(paper => {
        const category = paper.category || 'Uncategorized';
        if (!categoryGroups.has(category)) {
            categoryGroups.set(category, new Map());
        }
        const topicMap = categoryGroups.get(category)!;
        if (!topicMap.has(paper.topic)) {
            topicMap.set(paper.topic, []);
        }
        topicMap.get(paper.topic)!.push(paper);
    });

    // Calculate positions
    let currentY = START_Y;

    // Sort categories (optional: alphabetical or custom order)
    const sortedCategories = Array.from(categoryGroups.keys()).sort();

    sortedCategories.forEach(category => {
        const topicMap = categoryGroups.get(category)!;
        const sortedTopics = Array.from(topicMap.keys()).sort();

        const categoryStartY = currentY;

        sortedTopics.forEach(topic => {
            const papers = topicMap.get(topic)!;

            // Group papers by year within this topic to handle overlaps
            const papersByYear = new Map<number, Paper[]>();
            papers.forEach(p => {
                if (!papersByYear.has(p.year)) papersByYear.set(p.year, []);
                papersByYear.get(p.year)!.push(p);
            });

            papers.forEach(paper => {
                let x = 0;
                let y = 0;

                if (paper.position) {
                    x = paper.position.x;
                    y = paper.position.y;
                } else {
                    const minYear = Math.min(...data.papers.map(p => p.year));
                    x = START_X + (paper.year - minYear) * COLUMN_WIDTH;
                    y = currentY;

                    // Handle overlaps
                    const peers = papersByYear.get(paper.year) || [];
                    const indexInGroup = peers.findIndex(p => p.id === paper.id);
                    if (peers.length > 1) {
                        x += (indexInGroup * 20) - ((peers.length - 1) * 10);
                        y += (indexInGroup * 20) - ((peers.length - 1) * 10);
                    }
                }

                nodes.push({
                    id: paper.id,
                    type: 'paper',
                    position: { x, y },
                    data: { ...paper },
                });
            });

            currentY += ROW_HEIGHT;
        });

        // Add Category Node
        const categoryHeight = currentY - categoryStartY - 20; // -20 for spacing
        nodes.push({
            id: `cat-${category}`,
            type: 'category',
            position: { x: 0, y: categoryStartY },
            data: { label: category },
            style: { height: categoryHeight },
            draggable: false,
            selectable: false,
            zIndex: -1,
        });

        currentY += 50; // Extra spacing between categories
    });

    // Create Edges
    data.citations.forEach(citation => {
        nodes.some(n => n.id === citation.sourcePaperId) &&
            nodes.some(n => n.id === citation.targetPaperId) &&
            edges.push({
                id: citation.id,
                source: citation.sourcePaperId,
                target: citation.targetPaperId,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#cbd5e1', strokeWidth: 1 },
            });
    });

    return { nodes, edges };
};
