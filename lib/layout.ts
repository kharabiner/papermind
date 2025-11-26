import { Node, Edge } from '@xyflow/react';
import { MindMapData, Paper, Topic } from '@/types';

const COLUMN_WIDTH = 400;
const ROW_HEIGHT = 200;
const START_X = 100;
export const calculateLayout = (data: MindMapData) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const CATEGORY_WIDTH = 150;
    const PAPER_START_X = CATEGORY_WIDTH + 50; // Reduced gap
    const START_Y = 50;
    const COLUMN_WIDTH = 300; // Reduced width (Node is ~260px)
    const ROW_HEIGHT = 280;

    // Group papers by Category -> Topic
    const categoryGroups = new Map<string, Map<string, Paper[]>>();

    data.papers.forEach(paper => {
        const category = (paper.categories && paper.categories.length > 0) ? paper.categories[0] : 'Uncategorized';
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

    // Sort categories
    const sortedCategories = Array.from(categoryGroups.keys()).sort();

    sortedCategories.forEach(category => {
        const topicMap = categoryGroups.get(category)!;
        const sortedTopics = Array.from(topicMap.keys()).sort();

        const categoryStartY = currentY;

        sortedTopics.forEach(topic => {
            const papers = topicMap.get(topic)!;
            const topicStartY = currentY;

            // Group papers by year within this topic
            const papersByYear = new Map<number, Paper[]>();
            papers.forEach(p => {
                if (!papersByYear.has(p.year)) papersByYear.set(p.year, []);
                papersByYear.get(p.year)!.push(p);
            });

            // Sort papers within each year by month
            papersByYear.forEach((yearPapers) => {
                yearPapers.sort((a, b) => (a.month || 0) - (b.month || 0));
            });

            // Position Papers
            papers.forEach(paper => {
                let x = 0;
                let y = 0;

                if (paper.position) {
                    x = paper.position.x;
                    y = paper.position.y;
                } else {
                    // Calculate minYear for this specific topic to ensure papers start near the category
                    const topicMinYear = Math.min(...papers.map(p => p.year));

                    // X position based on year, relative to the topic's start year
                    x = PAPER_START_X + (paper.year - topicMinYear) * COLUMN_WIDTH;
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

            currentY += ROW_HEIGHT; // Move down for next row of papers
        });

        // Add Category Node
        // Calculate center based on the ACTUAL positions of the papers we just added.
        // This ensures that if papers have custom positions (loaded from storage), the category aligns with them.

        let minPaperY = Infinity;
        let maxPaperY = -Infinity;
        let hasPapers = false;

        nodes.forEach(node => {
            if (node.type === 'paper' && (node.data.categories as string[])?.[0] === category) {
                hasPapers = true;
                const y = node.position.y;
                const h = 200; // Increased fallback height
                if (y < minPaperY) minPaperY = y;
                if (y + h > maxPaperY) maxPaperY = y + h;
            }
        });

        let categoryY = 0;
        if (hasPapers) {
            const categoryHeight = 40;
            // Added +20px visual offset
            categoryY = (minPaperY + maxPaperY) / 2 - (categoryHeight / 2) + 20;
        } else {
            // Fallback if no papers (shouldn't happen with current logic)
            categoryY = categoryStartY;
        }

        nodes.push({
            id: `cat-${category}`,
            type: 'category',
            position: { x: 75, y: categoryY },
            data: { label: category },
            draggable: true,
            selectable: false,
            zIndex: 10,
            origin: [0.5, 0.5],
        });

        currentY += 50; // Extra spacing between categories
    });

    // Create Citation Edges (Paper -> Paper)
    data.citations.forEach(citation => {
        nodes.some(n => n.id === citation.sourcePaperId) &&
            nodes.some(n => n.id === citation.targetPaperId) &&
            edges.push({
                id: citation.id,
                source: citation.sourcePaperId,
                target: citation.targetPaperId,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5,5' }, // Dashed for citations to distinguish
            });
    });

    return { nodes, edges };
};
