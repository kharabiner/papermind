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
                    category: topic, // Assign topic as category for generated papers
                    abstract: `This is a simulated abstract for a paper about ${topic} published in ${year}.`,
                });
            }
        }
    }

    // Add specific papers with categories
    papers.push(
        {
            id: 'p1',
            title: 'Attention Is All You Need',
            authors: ['Vaswani et al.'],
            year: 2017,
            topic: 'Artificial Intelligence', // Changed from 'LLM' to match TOPICS
            category: 'Artificial Intelligence',
            abstract: 'The Transformer architecture.',
        },
        {
            id: 'p2',
            title: 'BERT: Pre-training of Deep Bidirectional Transformers',
            authors: ['Devlin et al.'],
            year: 2018,
            topic: 'Artificial Intelligence', // Changed from 'LLM' to match TOPICS
            category: 'Artificial Intelligence',
            abstract: 'Bidirectional training of Transformer.',
        },
        {
            id: 'p3',
            title: 'GPT-3: Language Models are Few-Shot Learners',
            authors: ['Brown et al.'],
            year: 2020,
            topic: 'Artificial Intelligence', // Changed from 'LLM' to match TOPICS
            category: 'Artificial Intelligence',
            abstract: 'Scaling up language models.',
        },
        {
            id: 'p4',
            title: 'ResNet: Deep Residual Learning for Image Recognition',
            authors: ['He et al.'],
            year: 2016,
            topic: 'Artificial Intelligence', // Changed from 'Computer Vision' to match TOPICS
            category: 'Artificial Intelligence',
            abstract: 'Residual learning framework.',
        },
        {
            id: 'p5',
            title: 'ViT: An Image is Worth 16x16 Words',
            authors: ['Dosovitskiy et al.'],
            year: 2020,
            topic: 'Artificial Intelligence', // Changed from 'Computer Vision' to match TOPICS
            category: 'Artificial Intelligence',
            abstract: 'Transformers for image recognition.',
        },
        {
            id: 'p6',
            title: 'React: A JavaScript Library for Building User Interfaces',
            authors: ['Jordan Walke'],
            year: 2013,
            topic: 'Software Engineering', // Changed from 'Web Development' to a new topic
            category: 'Software Engineering',
            abstract: 'Component-based UI library.',
        },
        {
            id: 'p7',
            title: 'Next.js: The React Framework',
            authors: ['Vercel'],
            year: 2016,
            topic: 'Software Engineering', // Changed from 'Web Development' to a new topic
            category: 'Software Engineering',
            abstract: 'Server-side rendering for React.',
        },
    );

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

    // Ensure all topics from the added papers are included in TOPICS
    const allTopics = new Set(TOPICS);
    papers.forEach(p => allTopics.add(p.topic));

    return {
        papers,
        citations,
        topics: Array.from(allTopics)
    };
}
