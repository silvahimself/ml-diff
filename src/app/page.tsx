"use client";

import { useState, useRef } from "react";

interface DiffSegment {
  text: string;
  type: 'added' | 'removed' | 'unchanged';
}

export default function HomePage() {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [diffResults, setDiffResults] = useState<DiffSegment[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const leftTextareaRef = useRef<HTMLTextAreaElement>(null);
  const rightTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleLeftTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLeftText(e.target.value);
  };

  const handleRightTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRightText(e.target.value);
  };

  const handleLeftScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const leftTextarea = e.currentTarget;
    const rightTextarea = rightTextareaRef.current;
    
    if (rightTextarea) {
      rightTextarea.scrollTop = leftTextarea.scrollTop;
    }
  };

  const handleRightScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const rightTextarea = e.currentTarget;
    const leftTextarea = leftTextareaRef.current;
    
    if (leftTextarea) {
      leftTextarea.scrollTop = rightTextarea.scrollTop;
    }
  };

  const handleCompare = () => {
    if (!leftText.trim() && !rightText.trim()) {
      setDiffResults([]);
      setShowResults(false);
      return;
    }

    const leftWords = leftText.split(/(\s+)/);
    const rightWords = rightText.split(/(\s+)/);
    const diff = computeDiff(leftWords, rightWords);
    
    setDiffResults(diff);
    setShowResults(true);
  };

  const handleClear = () => {
    setLeftText("");
    setRightText("");
    setDiffResults([]);
    setShowResults(false);
  };

  const computeDiff = (left: string[], right: string[]): DiffSegment[] => {
    const result: DiffSegment[] = [];
    let i = 0;
    let j = 0;

    while (i < left.length || j < right.length) {
      if (i >= left.length) {
        // Remaining items in right are additions
        const rightText = right[j];
        if (rightText !== undefined) {
          result.push({ text: rightText, type: 'added' });
        }
        j++;
      } else if (j >= right.length) {
        // Remaining items in left are removals
        const leftText = left[i];
        if (leftText !== undefined) {
          result.push({ text: leftText, type: 'removed' });
        }
        i++;
      } else if (left[i] === right[j]) {
        // Items are the same
        const leftText = left[i];
        if (leftText !== undefined) {
          result.push({ text: leftText, type: 'unchanged' });
        }
        i++;
        j++;
      } else {
        // Items are different - look ahead to see if we can find a match
        let foundMatch = false;
        const currentLeft = left[i];
        const currentRight = right[j];
        
        if (currentLeft !== undefined && currentRight !== undefined) {
          for (let k = j + 1; k < right.length && k < j + 5; k++) {
            const rightCandidate = right[k];
            if (rightCandidate !== undefined && currentLeft === rightCandidate) {
              // Found a match - items between j and k are additions
              for (let l = j; l < k; l++) {
                const rightText = right[l];
                if (rightText !== undefined) {
                  result.push({ text: rightText, type: 'added' });
                }
              }
              result.push({ text: currentLeft, type: 'unchanged' });
              i++;
              j = k + 1;
              foundMatch = true;
              break;
            }
          }
          
          if (!foundMatch) {
            for (let k = i + 1; k < left.length && k < i + 5; k++) {
              const leftCandidate = left[k];
              if (leftCandidate !== undefined && leftCandidate === currentRight) {
                // Found a match - items between i and k are removals
                for (let l = i; l < k; l++) {
                  const leftText = left[l];
                  if (leftText !== undefined) {
                    result.push({ text: leftText, type: 'removed' });
                  }
                }
                result.push({ text: leftCandidate, type: 'unchanged' });
                i = k + 1;
                j++;
                foundMatch = true;
                break;
              }
            }
          }
          
          if (!foundMatch) {
            // No match found nearby - treat as replacement
            result.push({ text: currentLeft, type: 'removed' });
            result.push({ text: currentRight, type: 'added' });
            i++;
            j++;
          }
        } else {
          // Handle edge case where one of the items is undefined
          i++;
          j++;
        }
      }
    }

    return result;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCompare();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Miliora <span className="text-blue-400">Diff</span> Checker
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Compare two texts and highlight the differences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <label 
              htmlFor="left-text" 
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Original Text
            </label>
            <textarea
              id="left-text"
              ref={leftTextareaRef}
              value={leftText}
              onChange={handleLeftTextChange}
              onKeyDown={handleKeyDown}
              onScroll={handleLeftScroll}
              className="w-full h-64 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Paste your original text here..."
              aria-label="Original text input"
            />
          </div>
          
          <div>
            <label 
              htmlFor="right-text" 
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Modified Text
            </label>
            <textarea
              id="right-text"
              ref={rightTextareaRef}
              value={rightText}
              onChange={handleRightTextChange}
              onKeyDown={handleKeyDown}
              onScroll={handleRightScroll}
              className="w-full h-64 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Paste your modified text here..."
              aria-label="Modified text input"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
          <button
            onClick={handleCompare}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Compare texts and show differences"
          >
            Compare Texts
          </button>
          
          <button
            onClick={handleClear}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Clear all text inputs"
          >
            Clear All
          </button>
        </div>

        {showResults && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
            <h2 className="text-xl font-semibold text-white mb-4">
              Comparison Results
            </h2>
            
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-slate-300">Removed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-slate-300">Added</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-500 rounded"></div>
                <span className="text-slate-300">Unchanged</span>
              </div>
            </div>

            <div 
              className="p-4 bg-slate-900 rounded-lg border border-slate-700 min-h-[100px] max-h-96 overflow-y-auto leading-relaxed"
              role="region"
              aria-label="Diff results"
            >
              {diffResults.length === 0 ? (
                <p className="text-slate-400 italic">No differences found.</p>
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {diffResults.map((segment, index) => (
                    <span
                      key={index}
                      className={`${
                        segment.type === 'added'
                          ? 'bg-green-500/20 text-green-300 border-l-2 border-green-500 pl-1'
                          : segment.type === 'removed'
                          ? 'bg-red-500/20 text-red-300 border-l-2 border-red-500 pl-1 line-through'
                          : 'text-slate-300'
                      }`}
                      title={
                        segment.type === 'added'
                          ? 'Added text'
                          : segment.type === 'removed'
                          ? 'Removed text'
                          : 'Unchanged text'
                      }
                    >
                      {segment.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-slate-400">
          <p>Tip: Use Ctrl/Cmd + Enter to compare while typing</p>
        </div>
      </div>
    </main>
  );
}
