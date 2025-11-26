import { MindMapData, Paper, Citation, Topic } from '@/types';

const TOPICS: Topic[] = ['Artificial Intelligence', 'Brain-Computer Interface', 'Neuroscience', 'Robotics'];

export function generateMockData(): MindMapData {
    const papers: Paper[] = [];
    const citations: Citation[] = [];

    // Generate papers across different years and topics
    let paperIdCounter = 1;
    const startYear = 2015;
    const endYear = 2024;

    for (const topic of TOPICS) {
        for (let year = startYear; year <= endYear; year++) {
            // Generate 1-3 papers per topic per year
            const count = Math.floor(Math.random() * 3) + 1;

            for (let i = 0; i < count; i++) {
                papers.push({
                    id: `p-${paperIdCounter++}`,
                    title: `${topic} Research ${year} - Vol ${i + 1}`,
                    authors: [`Author ${String.fromCharCode(65 + i)}`, `Author ${String.fromCharCode(66 + i)}`],
                    year: year,
                    topic: topic,
                    abstract: `This is a simulated abstract for a paper about ${topic} published in ${year}.`,
                });
            }
        }
    }

    // Generate random citations
    // Papers can only cite papers from the past (or same year)
    papers.forEach((sourcePaper) => {
        // 30% chance to cite something
        if (Math.random() > 0.3) {
            const potentialTargets = papers.filter(p => p.year <= sourcePaper.year && p.id !== sourcePaper.id);
            if (potentialTargets.length > 0) {
                const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                citations.push({
                    id: `c-${sourcePaper.id}-${target.id}`,
                    sourcePaperId: sourcePaper.id,
                    targetPaperId: target.id,
                    context: 'Related Work'
                });
            }
        }
    });

    return {
        papers,
        citations,
        topics: TOPICS
    };
}
