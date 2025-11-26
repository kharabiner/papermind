import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Paper, Topic } from '@/types';

interface AddPaperModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (paper: Omit<Paper, 'id'>) => void;
    existingTopics: Topic[];
}

const AddPaperModal = ({ isOpen, onClose, onAdd, existingTopics }: AddPaperModalProps) => {
    const [title, setTitle] = useState('');
    const [authors, setAuthors] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState<number | undefined>(undefined);
    const [category, setCategory] = useState('');
    const [topic, setTopic] = useState('');
    const [newTopic, setNewTopic] = useState('');
    const [isNewTopic, setIsNewTopic] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalTopic = isNewTopic ? newTopic : topic;

        if (!title || !finalTopic || !category) return;

        onAdd({
            title,
            authors: authors.split(',').map(a => a.trim()).filter(a => a),
            year: Number(year),
            month: month,
            topic: finalTopic,
            categories: category.split(',').map(c => c.trim()).filter(c => c),
        });

        // Reset form
        setTitle('');
        setAuthors('');
        setYear(new Date().getFullYear());
        setMonth(undefined);
        setCategory('');
        setTopic('');
        setNewTopic('');
        setIsNewTopic(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Add New Paper</h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Paper Title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Authors (comma separated)</label>
                        <input
                            type="text"
                            value={authors}
                            onChange={(e) => setAuthors(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Author A, Author B"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category (Macro Topic)</label>
                        <input
                            type="text"
                            required
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. AI, Systems (First one will be the primary row)"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
                            <input
                                type="number"
                                required
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Month</label>
                            <input
                                type="number"
                                min="1"
                                max="12"
                                value={month || ''}
                                onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Optional"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Topic</label>
                            {isNewTopic ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={newTopic}
                                        onChange={(e) => setNewTopic(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="New Topic"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsNewTopic(false)}
                                        className="text-xs text-blue-500 hover:underline shrink-0"
                                    >
                                        Select
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <select
                                        required
                                        value={topic}
                                        onChange={(e) => {
                                            if (e.target.value === '__new__') {
                                                setIsNewTopic(true);
                                                setTopic('');
                                            } else {
                                                setTopic(e.target.value);
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="">Select Topic</option>
                                        {existingTopics.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                        <option value="__new__">+ Create New Topic</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors"
                        >
                            Add Paper
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPaperModal;
