import { Node } from '@xyflow/react';

export type Topic = string;

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  topic: Topic;
  abstract?: string;
  url?: string;
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
