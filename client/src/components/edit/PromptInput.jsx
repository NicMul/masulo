import { useState } from 'react';
import { MessageSquarePlus, Send, X } from 'lucide-react';

export default function PromptInput({ 
  value = '', 
  onChange, 
  placeholder = 'Enter your prompt here...',
  className = '',
  onSubmit,
  onClick,
  t
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onClick && onClick();
  };

  const handleSubmit = () => {
    if (value.trim()) {
      console.log('Submitted prompt:', value);
      if (onSubmit) {
        onSubmit(value);
      }
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <>
        {!isExpanded ? (
          <button
            onClick={handleToggle}
            className=" absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-blue-500 to-purple-600 scale-100 shadow-lg text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-blue-700 text-white p-2 px-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            aria-label="Open prompt input"
          >
            {t ? t('edit.prompt.addPrompt') : 'Add Prompt'}
          </button>
        ) : (
          <div className=" absolute bottom-[-50px] right-0 bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 w-96 border border-gray-700 z-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-200">{t ? t('edit.prompt.title') : 'AI Prompt'}</h3>
              <button
                onClick={handleToggle}
                className="text-gray-400 hover:text-gray-200 transition-colors"
                aria-label="Close prompt input"
              >
                <X size={20} />
              </button>
            </div>
            
            <textarea
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full h-32 p-3 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-200 text-gray-600 placeholder-gray-400 ${className}`}
              autoFocus
            />
            
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-gray-400">
                {t ? t('edit.prompt.shortcut') : 'Cmd/Ctrl + Enter'}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!value.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
              >
                Submit
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </>
  );
}