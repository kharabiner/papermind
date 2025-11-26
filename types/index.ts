import { Node } from '@xyflow/react';

export type Topic = string;

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  month?: number; // 1-12
  topic: Topic;
  categories: string[]; // e.g. ["AI", "Systems"] - First one is primary for layout
  abstract?: string;
  url?: string;
  position?: { x: number; y: number };
}

export interface Citation {
  id: string;
  sourcePaperId: string;
  targetPaperId: string;
  context?: string; // e.g., "Methodology", "Results"
}

export interface MindMapData {
  papers: Paper[];
  citations: Citation[];
  topics: Topic[];
}

export type AppNode = Node<Paper & Record<string, unknown>, 'paper'>;
