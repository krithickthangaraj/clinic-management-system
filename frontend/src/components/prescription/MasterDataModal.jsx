import React, { useState, useEffect } from 'react';
import { masterDataService } from '../../services/masterDataService';

export default function MasterDataModal({
  isOpen = false,
  category = 'complaints',
  title = 'Chief Complaints',
  onClose = () => {},
  onDataUpdated = () => {},
}) {
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setItems(masterDataService.getCategory(category));
      setNewItemText('');
      setEditingIndex(null);
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e?.preventDefault?.();
    if (newItemText.trim()) {
      masterDataService.addItem(category, newItemText.trim());
      setItems(masterDataService.getCategory(category));
      setNewItemText('');
      onDataUpdated();
    }
  };

  const handleSaveEdit = (oldItem) => {
    if (editText.trim()) {
      masterDataService.updateItem(category, oldItem, editText.trim());
      setItems(masterDataService.getCategory(category));
      setEditingIndex(null);
      setEditText('');
      onDataUpdated();
    }
  };

  const handleDelete = (item) => {
    masterDataService.deleteItem(category, item);
    setItems(masterDataService.getCategory(category));
    onDataUpdated();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      data-testid="master-data-modal"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Manage Master Data: {title}
              </h3>
              <p className="text-[11px] text-slate-500">
                Global pre-existing suggestions used across all patient visits
              </p>
            </div>
          </div>

          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Add New Item Row */}
        <form className="p-4 border-b border-slate-100 flex items-center gap-2" onSubmit={handleAdd}>
          <input
            type="text"
            className="flex-1 h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            placeholder={`Add new ${title.toLowerCase()} entry...`}
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
          />
          <button
            type="submit"
            className="h-10 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add to Master</span>
          </button>
        </form>

        {/* Master Items List */}
        <div className="flex-1 p-4 overflow-y-auto divide-y divide-slate-100 max-h-[50vh]">
          {items.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No entries found. Add your first item above.
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={idx}
                className="py-2.5 flex items-center justify-between gap-3 group hover:bg-slate-50 px-2 rounded-lg transition-colors"
              >
                {editingIndex === idx ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 h-8 px-2.5 bg-white border border-teal-500 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item)}
                    />
                    <button
                      type="button"
                      className="h-8 px-2.5 bg-teal-700 text-white rounded text-xs font-semibold"
                      onClick={() => handleSaveEdit(item)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="h-8 px-2 bg-slate-100 text-slate-600 rounded text-xs"
                      onClick={() => setEditingIndex(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-xs font-medium text-slate-800 truncate flex-1">
                      {item}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* Edit Button */}
                      <button
                        type="button"
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
                        onClick={() => {
                          setEditingIndex(idx);
                          setEditText(item);
                        }}
                        title="Edit entry"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-rose-50 rounded transition-colors"
                        onClick={() => handleDelete(item)}
                        title="Delete from master"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
