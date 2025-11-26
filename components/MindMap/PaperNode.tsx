
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Paper } from '@/types';
import { FileText, Calendar, User, Trash2, RefreshCw } from 'lucide-react';

// We use NodeProps without generic to satisfy React Flow's nodeTypes requirement
// and cast data inside the component
const PaperNode = ({ id, data }: NodeProps) => {
    const paper = data as unknown as Paper;
    const onDelete = data.onDelete as (id: string) => void;

    return (
        <div className="group w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors overflow-hidden relative">
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
                        className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full shadow-sm border border-slate-200 dark:border-slate-700"
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
                        className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full shadow-sm border border-slate-200 dark:border-slate-700"
                        title="Delete Paper"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Header / Title */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 pr-8">
                <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2">
                        {paper.title}
                    </h3>
                </div>
            </div>

            {/* Body / Metadata */}
            <div className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <User className="w-3 h-3" />
                    <span className="truncate">{paper.authors.join(', ')}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        <Calendar className="w-3 h-3" />
                        <span>{paper.year}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        {paper.topic}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default memo(PaperNode);


