import { Node, Edge } from '@xyflow/react';
import { MindMapData, Paper, Topic } from '@/types';

const COLUMN_WIDTH = 400;
const ROW_HEIGHT = 200;
const START_X = 100;
const START_Y = 100;

export function calculateLayout(data: MindMapData) {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Group papers by (Topic, Year) to handle overlaps
    const groupedPapers = new Map<string, Paper[]>();

    data.papers.forEach(paper => {
        const key = `${paper.topic}-${paper.year}`;
        if (!groupedPapers.has(key)) {
            groupedPapers.set(key, []);
        }
        groupedPapers.get(key)?.push(paper);
    });

    // Create Nodes
    data.papers.forEach(paper => {
        const topicIndex = data.topics.indexOf(paper.topic);
        if (topicIndex === -1) return;

        // Basic Grid Position
        let x = START_X + topicIndex * COLUMN_WIDTH;
        // Y is based on year relative to min year (or just raw year mapping)
        // Let's find min year first or just assume a range
        const minYear = Math.min(...data.papers.map(p => p.year));
        let y = START_Y + (paper.year - minYear) * ROW_HEIGHT;

        // Handle overlaps within the same cell
        const key = `${paper.topic}-${paper.year}`;
        const peers = groupedPapers.get(key) || [];
        const indexInGroup = peers.findIndex(p => p.id === paper.id);

        // Offset peers slightly so they don't perfectly overlap
        // Or stack them vertically/horizontally
        if (peers.length > 1) {
            x += (indexInGroup * 20) - ((peers.length - 1) * 10);
            y += (indexInGroup * 20) - ((peers.length - 1) * 10);
        }

        nodes.push({
            id: paper.id,
            type: 'paper',
            position: { x, y },
            data: { ...paper }, // Pass paper data as node data
        });
    });

    // Create Edges
    data.citations.forEach(citation => {
        edges.push({
            id: citation.id,
            source: citation.sourcePaperId,
            target: citation.targetPaperId,
            animated: true,
            style: { stroke: '#94a3b8' },
            type: 'default', // or 'smoothstep', 'bezier'
        });
    });

    return { nodes, edges };
}
