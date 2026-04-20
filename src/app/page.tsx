"use client";

import { useState, useEffect } from "react";
import { useTallyStore } from "../store/useTallyStore";
import { Plus, Search, SortAsc, Save, Share2, Trash2, Edit2, Check, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { toPng } from "html-to-image";

export default function Home() {
  const { tallies, fetchTallies, createTally, deleteTally, updateTally } = useTallyStore();
  const [newTallyName, setNewTallyName] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isRefetching, setIsRefetching] = useState(false);

  useEffect(() => {
    fetchTallies(search, sort);
  }, [search, sort, fetchTallies]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTallyName.trim()) return;
    createTally(newTallyName);
    setNewTallyName("");
  };

  const handleRefetch = async () => {
    setIsRefetching(true);
    try {
      await fetchTallies(search, sort);
      toast.success("Refreshed tallies!");
    } finally {
      setIsRefetching(false);
    }
  };

  const handleNameSave = (tally: any) => {
    if (!editName.trim() || editName === tally.name) {
      setEditingId(null);
      return;
    }
    updateTally(tally._id, { name: editName });
    setEditingId(null);
    toast.success("Name updated");
  };

  const handleSaveAll = async () => {
    const element = document.getElementById("tallies-container");
    if (!element) return;
    
    const toastId = toast.loading("Generating image...");
    try {
      const dataUrl = await toPng(element, {
        backgroundColor: "#f8fafc",
        filter: (node) => {
          if (node instanceof HTMLElement) {
            return node.getAttribute("data-html2canvas-ignore") !== "true";
          }
          return true;
        }
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "all-tallies.png";
      a.click();
      toast.success("Image downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate image.", { id: toastId });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Tally App",
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      toast.error("Failed to share.");
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 w-full flex-grow flex flex-col pt-8 sm:pt-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent pb-1">
          My Tallies
        </h1>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={handleRefetch}
            disabled={isRefetching}
            className="p-2 sm:p-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-sm hover:shadow active:scale-95 text-slate-900 disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 text-emerald-500 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSaveAll}
            className="p-2 sm:p-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-sm hover:shadow active:scale-95 text-slate-900"
            title="Save Image"
          >
            <Save className="w-5 h-5 text-blue-500" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 sm:p-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-sm hover:shadow active:scale-95 text-slate-900"
            title="Share dashboard"
          >
            <Share2 className="w-5 h-5 text-indigo-500" />
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-grow shadow-sm rounded-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tallies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 placeholder-slate-400"
          />
        </div>
        <div className="relative min-w-[160px] shadow-sm rounded-xl">
          <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-11 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 appearance-none cursor-pointer"
          >
            <option value="latest">Latest First</option>
            <option value="highest">Highest Count</option>
          </select>
        </div>
      </div>

      {/* Create Tally Input */}
      <form onSubmit={handleCreate} className="flex gap-3 mb-10 shadow-sm rounded-xl overflow-visible">
        <input
          type="text"
          placeholder="Add your tally"
          value={newTallyName}
          onChange={(e) => setNewTallyName(e.target.value)}
          className="flex-grow bg-white border border-slate-200 rounded-xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg"
        />
        <button
          type="submit"
          disabled={!newTallyName.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl px-5 sm:px-6 py-4 transition-all shadow-md shadow-blue-500/30 font-semibold flex items-center justify-center transform active:scale-95"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </form>

      {/* Tally List */}
      <div id="tallies-container" className="flex flex-col gap-3 pb-20 p-2 sm:p-4 -mx-2 sm:-mx-4 bg-slate-50">
        <AnimatePresence>
          {tallies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 text-slate-800 bg-white rounded-2xl border border-slate-200 shadow-sm border-dashed"
            >
              No tallies found. Create one to get started!
            </motion.div>
          ) : (
            tallies.map((tally) => (
              <motion.div
                key={tally._id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md flex flex-wrap sm:flex-nowrap items-center justify-between overflow-hidden transition-all duration-200"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <Link
                  href={`/tally/${tally._id}`}
                  className="flex-grow flex items-center justify-between pr-4 sm:pr-6 cursor-pointer mb-3 sm:mb-0 w-full sm:w-auto"
                >
                  {editingId === tally._id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-white border-2 border-blue-500 rounded-lg px-3 py-1.5 text-lg sm:text-xl font-bold w-full focus:outline-none text-slate-800 shadow-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleNameSave(tally);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            setEditingId(null);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-lg sm:text-xl font-bold text-slate-800">{tally.name}</span>
                      <span className="text-xs sm:text-sm text-slate-800">
                        {new Date(tally.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-center h-10 w-14 sm:h-12 sm:w-16 bg-blue-50 rounded-xl text-xl sm:text-2xl font-black text-blue-600 border border-blue-100 group-hover:bg-blue-100 transition-colors">
                    {tally.count}
                  </div>
                </Link>

                <div data-html2canvas-ignore="true" className="flex gap-2 isolate w-full sm:w-auto justify-end sm:justify-start">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (editingId === tally._id) {
                        handleNameSave(tally);
                      } else {
                        setEditingId(tally._id);
                        setEditName(tally.name);
                      }
                    }}
                    className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 transition-all transform active:scale-95"
                    title={editingId === tally._id ? "Save Name" : "Edit Tally"}
                  >
                    {editingId === tally._id ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    ) : (
                      <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Are you sure you want to delete this tally?")) {
                        deleteTally(tally._id);
                      }
                    }}
                    className="p-2 sm:p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-all transform active:scale-95"
                    title="Delete Tally"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
