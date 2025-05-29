import React, { useState } from 'react';
import { FaRobot, FaSpinner, FaTimes, FaLightbulb, FaPlus, FaExchangeAlt, FaEllipsisV } from 'react-icons/fa';

const GeminiSuggestions = ({ 
  suggestions, 
  isLoading, 
  error,
  onSuggestionClick, 
  onClose,
  isVisible,
  currentText = '' // Add current text to determine replacement vs append
}) => {
  const [showMenu, setShowMenu] = useState(null); // Track which suggestion's menu is open

  if (!isVisible || (!suggestions.length && !isLoading && !error)) {
    return null;
  }

  // Helper function to determine if suggestion will replace or append
  const getSuggestionAction = (suggestion) => {
    const currentPost = currentText.trim();
    const isCompleteSuggestion = suggestion.match(/^(What|How|Why|When|Let|This|Excited|Looking|Thanks|Hope|Can't|I|We|The)/i);
    const words = currentPost.split(' ');
    const lastWord = words[words.length - 1];
    const seemsIncomplete = lastWord && lastWord.length > 0 && !lastWord.match(/[.!?]$/);
    
    if (currentPost.length < 20 && isCompleteSuggestion) {
      return 'replace';
    } else if (seemsIncomplete && currentPost.length < 50) {
      return 'replace';
    } else {
      return 'append';
    }
  };

  const handleSuggestionAction = (suggestion, action) => {
    onSuggestionClick(suggestion, action);
    setShowMenu(null);
  };

  const toggleMenu = (index, e) => {
    e.stopPropagation();
    setShowMenu(showMenu === index ? null : index);
  };

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#1A1A1A] border border-[#404040] rounded-lg shadow-xl max-h-80 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-[#404040] flex items-center justify-between bg-gradient-to-r from-purple-600/20 to-blue-600/20">
        <div className="flex items-center gap-2">
          <FaRobot className="text-blue-400 text-sm animate-pulse" />
          <span className="text-white text-sm font-medium">AI Suggestions</span>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
            Gemini
          </span>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
        >
          <FaTimes className="text-xs" />
        </button>
      </div>
      
      {/* Content */}
      <div className="max-h-60 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <FaSpinner className="animate-spin text-blue-400 mr-3 text-lg" />
            <span className="text-gray-300 text-sm">AI is generating suggestions...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <div className="text-red-400 mb-2">
              <FaTimes className="text-lg mx-auto mb-2" />
              <span className="text-sm">Failed to generate suggestions</span>
            </div>
            <p className="text-gray-500 text-xs">{error}</p>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="p-2">
            {suggestions.map((suggestion, index) => {
              const action = getSuggestionAction(suggestion);
              return (
                <div key={index} className="relative">
                  <button
                    onClick={() => handleSuggestionAction(suggestion, action)}
                    className="w-full text-left p-3 rounded-lg hover:bg-[#404040] transition-all duration-200 group border border-transparent hover:border-blue-500/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <span className="text-blue-400 text-xs font-mono bg-blue-400/20 px-2 py-1 rounded group-hover:bg-blue-400/30 transition-colors">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm leading-relaxed break-words group-hover:text-blue-100 transition-colors">
                          {suggestion}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaLightbulb className="text-yellow-400 text-xs" />
                        </div>
                        {/* Action indicator */}
                        <div className="flex items-center gap-1">
                          {action === 'replace' ? (
                            <div className="flex items-center gap-1 bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-xs">
                              <FaExchangeAlt className="text-xs" />
                              <span>Replace</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">
                              <FaPlus className="text-xs" />
                              <span>Add</span>
                            </div>
                          )}
                          {/* Options menu button */}
                          <button
                            onClick={(e) => toggleMenu(index, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition-all"
                          >
                            <FaEllipsisV className="text-xs text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Options menu */}
                  {showMenu === index && (
                    <div className="absolute right-2 top-2 bg-[#2A2A2A] border border-[#404040] rounded-lg shadow-xl z-60 min-w-[120px]">
                      <button
                        onClick={() => handleSuggestionAction(suggestion, 'append')}
                        className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-[#404040] flex items-center gap-2 rounded-t-lg"
                      >
                        <FaPlus className="text-xs" />
                        Add to end
                      </button>
                      <button
                        onClick={() => handleSuggestionAction(suggestion, 'replace')}
                        className="w-full text-left px-3 py-2 text-sm text-orange-400 hover:bg-[#404040] flex items-center gap-2 rounded-b-lg"
                      >
                        <FaExchangeAlt className="text-xs" />
                        Replace text
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      
      {/* Footer */}
      {suggestions.length > 0 && !isLoading && !error && (
        <div className="p-3 border-t border-[#404040] bg-[#0F0F0F]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              💡 Click for smart action, or use ⋮ for options
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <span>Powered by</span>
              <FaRobot className="text-blue-400" />
              <span className="text-blue-400 font-medium">Gemini AI</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiSuggestions; 