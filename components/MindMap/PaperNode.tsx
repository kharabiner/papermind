
import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Paper } from '@/types';
import { FileText, Calendar, User, Trash2, RefreshCw } from 'lucide-react';

type PaperNodeData = Paper & {
    onDelete?: (id: string) => void;
    onResetPosition?: (id: string) => void;
    dimmed?: boolean;
    [key: string]: unknown;
};

// We use NodeProps without generic to satisfy React Flow's nodeTypes requirement
// and cast data inside the component
const PaperNode = ({ data, id }: NodeProps<Node<PaperNodeData>>) => {
    const paper = data;
    const onDelete = data.onDelete;
    const onResetPosition = data.onResetPosition;
    const dimmed = data.dimmed;

    const getStatusColor = () => {
        switch (paper.status) {
            case 'read': return 'border-l-green-500';
            case 'toread': return 'border-l-yellow-400';
            case 'authored': return 'border-l-purple-500';
            default: return 'border-l-transparent';
        }
    };

    return (
        <div className={`group w-64 bg-white rounded-lg border border-slate-200 border-l-4 ${getStatusColor()} p-4 hover:border-blue-400 transition-all shadow-sm ${dimmed ? 'opacity-20 grayscale' : 'opacity-100'}`}>
            {/* Handles for connections */}
            <Handle type="target" position={Position.Top} className="!bg-slate-400" />
            <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />

            {/* Action Buttons (Visible on Hover) */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                {data.onResetPosition && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            (data.onResetPosition as (id: string) => void)(id);
                        }}
                        className="p-1.5 bg-white text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full shadow-sm border border-slate-200"
                        title="Reset Position"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this paper?')) {
                                onDelete(id);
                            }
                        }}
                        className="p-1.5 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full shadow-sm border border-slate-200"
                        title="Delete Paper"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {/* Title & Icon */}
                <div className="flex items-start gap-2 pr-6">
                    {paper.url ? (
                        <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 transition-colors mt-0.5 shrink-0"
                            title="Open Paper URL"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <FileText className="w-4 h-4" />
                        </a>
                    ) : (
                        <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    )}
                    <h3 className="text-sm font-medium text-slate-900 leading-tight">
                        {paper.title}
                    </h3>
                </div>

                {/* Metadata */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        <span className="truncate">{paper.authors.join(', ')}</span>
                    </div>

                    <div className="flex items-end justify-between pt-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                            <Calendar className="w-3 h-3" />
                            <span>{paper.year}{paper.month ? `.${paper.month}` : ''}</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold text-right ml-2 leading-tight">
                            {paper.topic}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(PaperNode);


