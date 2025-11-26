import { MindMapData, Paper, Citation, Topic } from '@/types';

const TOPICS: Topic[] = ['Artificial Intelligence', 'Brain-Computer Interface', 'Neuroscience', 'Robotics'];

export function generateMockData(): MindMapData {
    const papers: Paper[] = [
        {
            id: 'p1',
            title: 'Attention Is All You Need',
            authors: ['Vaswani et al.'],
            year: 2017,
            month: 6,
            topic: 'Artificial Intelligence',
            categories: ['Artificial Intelligence', 'Deep Learning'],
            abstract: 'The Transformer architecture.',
            url: 'https://arxiv.org/abs/1706.03762',
        },
        {
            id: 'p2',
            title: 'BERT: Pre-training of Deep Bidirectional Transformers',
            authors: ['Devlin et al.'],
            year: 2018,
            month: 10,
            topic: 'Artificial Intelligence',
            categories: ['Artificial Intelligence', 'NLP'],
            abstract: 'Bidirectional training of Transformer.',
        },
        {
            id: 'p3',
            title: 'GPT-3: Language Models are Few-Shot Learners',
            authors: ['Brown et al.'],
            year: 2020,
            month: 5,
            topic: 'Artificial Intelligence',
            categories: ['Artificial Intelligence', 'NLP'],
            abstract: 'Scaling up language models.',
        },
        {
            id: 'p4',
            title: 'ResNet: Deep Residual Learning for Image Recognition',
            authors: ['He et al.'],
            year: 2016,
            month: 6,
            topic: 'Artificial Intelligence',
            categories: ['Artificial Intelligence', 'Computer Vision'],
            abstract: 'Residual learning framework.',
        },
        {
            id: 'p5',
            title: 'ViT: An Image is Worth 16x16 Words',
            authors: ['Dosovitskiy et al.'],
            year: 2020,
            month: 10,
            topic: 'Artificial Intelligence',
            categories: ['Artificial Intelligence', 'Computer Vision'],
            abstract: 'Transformers for image recognition.',
        },
        {
            id: 'p6',
            title: 'React: A JavaScript Library for Building User Interfaces',
            authors: ['Jordan Walke'],
            year: 2013,
            month: 5,
            topic: 'Software Engineering',
            categories: ['Software Engineering', 'Web Development'],
            abstract: 'Component-based UI library.',
        },
        {
            id: 'p7',
            title: 'Next.js: The React Framework',
            authors: ['Vercel'],
            year: 2016,
            month: 10,
            topic: 'Software Engineering',
            categories: ['Software Engineering', 'Web Development'],
            abstract: 'Server-side rendering for React.',
        },
    ];

    const citations: Citation[] = [
        { id: 'c1', sourcePaperId: 'p2', targetPaperId: 'p1', context: 'Based on' },
        { id: 'c2', sourcePaperId: 'p3', targetPaperId: 'p1', context: 'Based on' },
        { id: 'c3', sourcePaperId: 'p5', targetPaperId: 'p1', context: 'Adapted from' },
        { id: 'c4', sourcePaperId: 'p5', targetPaperId: 'p4', context: 'Inspired by' },
    ];

    // Ensure all topics from the added papers are included in TOPICS
    const allTopics = new Set(TOPICS);
    papers.forEach(p => allTopics.add(p.topic));

    return {
        papers,
        citations,
        topics: Array.from(allTopics)
    };
}
