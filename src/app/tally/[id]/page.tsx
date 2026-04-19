"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useTallyStore } from "@/store/useTallyStore";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Share2, Plus, Minus, RotateCcw, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { toPng } from "html-to-image";

interface DetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function TallyDetailPage({ params }: DetailsPageProps) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  
  const { tallies, updateTally, deleteTally } = useTallyStore();
  
  const [tally, setTally] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState<number | "">("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const fetchTally = async () => {
      const storeTally = tallies.find((t) => t._id === id);
      if (storeTally) {
        setTally(storeTally);
        setEditName(storeTally.name);
        setLoading(false);
      } else {
        try {
          const { data } = await api.get(`/${id}`);
          setTally(data);
          setEditName(data.name);
        } catch (error) {
          toast.error("Tally not found");
          router.push("/");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTally();
  }, [id, tallies, router]);

  const handleIncrement = () => {
    if (!tally) return;
    const newCount = tally.count + 1;
    setTally({ ...tally, count: newCount });
    updateTally(id, { count: newCount });
  };

  const handleDecrement = () => {
    if (!tally) return;
    const newCount = tally.count - 1;
    setTally({ ...tally, count: newCount });
    updateTally(id, { count: newCount });
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tally || typeof addAmount !== "number" || addAmount === 0) return;
    const newCount = tally.count + addAmount;
    setTally({ ...tally, count: newCount });
    updateTally(id, { count: newCount });
    setAddAmount("");
    toast.success(`Added ${addAmount}!`);
  };

  const handleReset = () => {
    if (!tally) return;
    setTally({ ...tally, count: 0 });
    updateTally(id, { count: 0 });
    toast.success("Tally reset to 0!");
  };

  const handleNameSave = () => {
    if (!tally || !editName.trim() || editName === tally.name) {
      setIsEditingName(false);
      return;
    }
    setTally({ ...tally, name: editName });
    updateTally(id, { name: editName });
    setIsEditingName(false);
    toast.success("Name updated");
  };

  const handleSaveAll = async () => {
    const element = document.getElementById("tally-card");
    if (!element) return;
    
    // Temporarily apply padding and background for the clean export
    const originalPadding = element.style.padding;
    const originalBg = element.style.background;
    element.style.padding = "40px";
    element.style.background = "#ffffff";
    
    const toastId = toast.loading("Generating image...");
    try {
      const dataUrl = await toPng(element, {
        backgroundColor: "#ffffff",
        filter: (node) => {
          if (node instanceof HTMLElement) {
            return node.getAttribute("data-html2canvas-ignore") !== "true";
          }
          return true;
        }
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `tally-${tally?.name || id}.png`;
      a.click();
      toast.success("Image downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate image.", { id: toastId });
    } finally {
      // Revert styles
      element.style.padding = originalPadding;
      element.style.background = originalBg;
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Tally - ${tally?.name}`,
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

  if (loading || !tally) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 w-full flex-grow flex flex-col pt-6 sm:pt-12 items-center pb-12">
      <div className="w-full flex justify-between items-center mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors bg-white hover:bg-slate-50 px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back</span>
        </Link>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={handleSaveAll}
            className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-slate-500"
            title="Save Image"
          >
            <Save className="w-5 h-5 text-blue-500" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-slate-500"
            title="Share"
          >
            <Share2 className="w-5 h-5 text-indigo-500" />
          </button>
        </div>
      </div>

      {/* Main Counter Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col items-center relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400" />
        
        {/* The export container isolates the Name and Count */}
        <div id="tally-card" className="flex flex-col items-center w-full rounded-2xl">
          {isEditingName ? (
            <div data-html2canvas-ignore="true" className="flex items-center gap-2 mb-8 mt-2 w-full max-w-sm">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white border-2 border-blue-500 rounded-xl px-4 py-2.5 text-xl sm:text-2xl font-bold text-center w-full focus:outline-none focus:ring-0 text-slate-800 shadow-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
              />
              <button
                onClick={handleNameSave}
                className="p-3 bg-green-500 text-white hover:bg-green-600 rounded-xl transition-colors shadow-sm"
              >
                <Check className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          ) : (
            <h1
              onClick={() => setIsEditingName(true)}
              className="text-2xl sm:text-4xl font-extrabold text-slate-800 mb-8 mt-2 cursor-pointer hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-200 text-center break-words max-w-full px-4"
              title="Click to edit name"
            >
              {tally.name}
            </h1>
          )}

          <div className="text-[6rem] sm:text-[9rem] font-black tracking-tighter text-slate-900 leading-none mb-10 select-none drop-shadow-sm">
            {tally.count}
          </div>
        </div>

        {/* Primary Controls */}
        <div data-html2canvas-ignore="true" className="flex gap-4 sm:gap-6 mb-10 w-full max-w-sm justify-center">
          <button
            onClick={handleDecrement}
            className="flex-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-2xl py-6 flex items-center justify-center transition-all transform active:scale-95 shadow border border-slate-200"
          >
            <Minus className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>
          <button
            onClick={handleIncrement}
            className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl py-6 flex items-center justify-center transition-all transform active:scale-95 shadow-lg shadow-blue-500/30 border border-blue-600"
          >
            <Plus className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>
        </div>

        {/* Custom Add Form */}
        <div data-html2canvas-ignore="true" className="w-full">
          <form onSubmit={handleAddCustom} className="w-full max-w-sm flex gap-3 mb-8 mx-auto">
            <input
              type="number"
              placeholder="Enter value"
              value={addAmount}
              onChange={(e) =>
                setAddAmount(e.target.value ? parseInt(e.target.value, 10) : "")
              }
              className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-900 text-lg shadow-inner"
            />
            <button
              type="submit"
              disabled={!addAmount}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl px-5 sm:px-8 py-3 font-semibold transition-all transform active:scale-95 shadow-md shadow-indigo-500/20"
            >
              Add
            </button>
          </form>
        </div>

        {/* Reset Button */}
        <div data-html2canvas-ignore="true" className="w-full border-t border-slate-100 pt-8 mt-2 flex justify-center">
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors font-semibold border border-red-100 shadow-sm"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Reset Counter</span>
          </button>
        </div>
      </motion.div>

      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleReset}
        title="Reset Tally"
        description={`Are you sure you want to reset "${tally.name}"? This action cannot be undone and will set the count permanently to 0.`}
        confirmText="Yes, reset it"
      />
    </main>
  );
}
