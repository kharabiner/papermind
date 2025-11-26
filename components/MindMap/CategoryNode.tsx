import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';

const CategoryNode = ({ data }: NodeProps) => {
    const label = data.label as string;
    const dimmed = data.dimmed as boolean;
    const isSelected = data.isSelected as boolean;

    return (
        <div className={`flex items-center justify-center w-[140px] px-4 py-2 rounded-full shadow-sm border transition-all duration-300 cursor-pointer
            ${dimmed ? 'opacity-20' : 'opacity-100'}
            ${isSelected
                ? 'bg-slate-800 border-slate-800 text-white shadow-lg scale-105 ring-2 ring-offset-2 ring-slate-400'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:border-slate-400 hover:shadow'}
        `}>
            <div className={`text-sm font-bold text-center leading-none
                ${isSelected ? 'text-white' : 'text-slate-600'}
            `}>
                {label}
            </div>
        </div>
    );
};

export default memo(CategoryNode);
