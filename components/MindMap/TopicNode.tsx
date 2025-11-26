import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

const TopicNode = ({ data }: NodeProps) => {
    const label = data.label as string;

    return (
        <div className="flex items-center justify-center min-w-[150px] px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg shadow-sm">
            <Handle type="target" position={Position.Left} className="!bg-slate-400" />
            <div className="text-sm font-bold text-slate-700 text-center whitespace-normal">
                {label}
            </div>
            <Handle type="source" position={Position.Right} className="!bg-slate-400" />
        </div>
    );
};

export default memo(TopicNode);
