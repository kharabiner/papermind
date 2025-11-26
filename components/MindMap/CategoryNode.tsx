import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';

const CategoryNode = ({ data }: NodeProps) => {
    const label = data.label as string;

    return (
        <div className="flex items-center justify-center h-full min-h-[100px] w-[50px] bg-slate-100 dark:bg-slate-800/50 rounded-l-xl border-l-4 border-blue-500 shadow-sm">
            <div
                className="text-lg font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap tracking-widest"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
            >
                {label}
            </div>
        </div>
    );
};

export default memo(CategoryNode);
