import React, { useRef, useState, useCallback, useEffect, useMemo, useContext } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import { AuthContext } from 'components/lib';
import { useKnowledgeGraph } from 'components/hooks/useKnowledgeGraph';

const NODE_COLORS = {
  Game:           '#3b82f6',
  ABTest:         '#f59e0b',
  Variant:        '#10b981',
  ABTestEvent:    '#8b5cf6',
  Promotion:      '#ef4444',
  PromoGame:      '#fb923c',
  AnalyticsEvent: '#06b6d4',
  Session:        '#84cc16',
};

const NODE_SIZES = {
  Game:           14,
  ABTest:         11,
  Variant:        8,
  ABTestEvent:    3,
  Promotion:      12,
  PromoGame:      9,
  AnalyticsEvent: 3,
  Session:        6,
};

const VIDEO_KEYS = new Set([
  'video', 'defaultVideo', 'currentVideo', 'themeVideo',
  'testVideo', 'promoVideo', 'videoA', 'videoB', 'assetUrl',
]);

const SKIP_KEYS = new Set([
  'image', 'defaultImage', 'currentImage', 'themeImage',
  'testImage', 'promoImage', 'imageA', 'imageB',
]);

const DEFAULT_COLOR = '#6b7280';
const DEFAULT_SIZE = 5;

const NL_EXAMPLES = [
  { group: 'A/B Tests', items: [
    'Which games have A/B tests?',
    'Which variant performed better for Tomb of Insanity?',
    'Show me the click-through rate by device for each variant',
    'What are the most popular games by total events?',
    'Compare hover vs click events across all tests',
    'Which test has the most impressions?',
    'Show all games and their groups',
    'What percentage of events are from mobile vs desktop?',
  ]},
  { group: 'Analytics', items: [
    'Which games have the most analytics events?',
    'Show the video engagement funnel per game',
    'How many sessions does each game have?',
    'Which games are visited together in the same session?',
    'What is the impression to click conversion rate per game?',
    'Show the device breakdown for analytics events',
  ]},
  { group: 'Promotions', items: [
    'Show all promotions and which games they include',
    'Which games appear in multiple promotions?',
    'Which promoted games also have A/B tests?',
    'How much analytics engagement do promoted games have?',
  ]},
];

const SHOW_LABEL_TYPES = new Set(Object.keys(NODE_SIZES).filter(
  t => t !== 'ABTestEvent' && t !== 'AnalyticsEvent'
));

function detectWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        supported: true,
        version: gl.getParameter(gl.VERSION),
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
      };
    }
    return { supported: false };
  } catch {
    return { supported: false };
  }
}

class WebGLErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 bg-slate-50 dark:bg-slate-950">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <p className="text-sm font-medium text-red-500">3D rendering failed</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[300px] text-center">{this.state.error?.message || 'WebGL context lost or unavailable'}</p>
          <button
            onClick={this.props.onFallback}
            className="mt-1 px-4 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            Switch to 2D
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function KnowledgeGraph() {
  const graphRef2D = useRef();
  const graphRef3D = useRef();
  const containerRef = useRef();
  const outerRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [queryOpen, setQueryOpen] = useState(true);
  const [queryInput, setQueryInput] = useState('');
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const webgl = useMemo(() => detectWebGL(), []);
  const [viewMode, setViewMode] = useState('2d');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const authContext = useContext(AuthContext);
  const isDark = authContext?.user?.dark_mode;

  const {
    graphData,
    loading,
    hiddenLabels,
    nodeLimits,
    toggleLabel,
    updateNodeLimit,
    filterGraphData,
    labelCounts,
    stats,
    queryMode,
    setQueryMode,
    queryRunning,
    queryResults,
    queryError,
    generatedCypher,
    runCypherQuery,
    runNLQuery,
  } = useKnowledgeGraph();

  const filteredData = useMemo(() => filterGraphData(), [filterGraphData]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const ref = viewMode === '2d' ? graphRef2D : graphRef3D;
    if (ref.current && filteredData.nodes.length > 0) {
      if (viewMode === '3d') {
        setTimeout(() => {
          if (ref.current) ref.current.cameraPosition({ x: 0, y: 0, z: 400 });
        }, 500);
      } else {
        setTimeout(() => {
          if (ref.current) ref.current.zoomToFit(400, 40);
        }, 800);
      }
    }
  }, [loading, viewMode]);

  useEffect(() => {
    const onChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      // Force dimension recalculation after the fullscreen transition settles
      setTimeout(() => {
        if (containerRef.current) {
          const { width, height } = containerRef.current.getBoundingClientRect();
          if (width > 0 && height > 0) {
            setDimensions({ width, height });
          }
        }
      }, 100);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!outerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      outerRef.current.requestFullscreen();
    }
  }, []);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleRunQuery = useCallback(() => {
    const q = queryInput.trim();
    if (!q) return;
    if (queryMode === 'natural') {
      runNLQuery(q);
    } else {
      runCypherQuery(q);
    }
  }, [queryInput, queryMode, runNLQuery, runCypherQuery]);

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleRunQuery();
  }, [handleRunQuery]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const color = NODE_COLORS[node.label] || DEFAULT_COLOR;
    const size = (NODE_SIZES[node.label] || DEFAULT_SIZE) * 0.6;

    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;

    if (SHOW_LABEL_TYPES.has(node.label) && globalScale > 0.6) {
      const fontSize = Math.max(10 / globalScale, 2);
      ctx.font = `${fontSize}px 'SF Mono', 'Fira Code', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fillText(node.name, node.x, node.y + size + 2);
      ctx.globalAlpha = 1;
    }
  }, []);

  const nodePointerAreaPaint = useCallback((node, color, ctx) => {
    const size = (NODE_SIZES[node.label] || DEFAULT_SIZE) * 0.6;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  const nodeThreeObjectFn = useCallback((node) => {
    const color = NODE_COLORS[node.label] || DEFAULT_COLOR;
    const size = NODE_SIZES[node.label] || DEFAULT_SIZE;

    const group = new THREE.Group();

    const geo = new THREE.SphereGeometry(size * 0.3, 16, 16);
    const mat = new THREE.MeshLambertMaterial({
      color,
      transparent: true,
      opacity: 0.9,
    });
    group.add(new THREE.Mesh(geo, mat));

    if (SHOW_LABEL_TYPES.has(node.label)) {
      const sprite = new SpriteText(node.name, 2.5, color);
      sprite.fontFace = 'SF Mono, Fira Code, monospace';
      sprite.position.y = size * 0.4 + 3;
      sprite.material.depthWrite = false;
      group.add(sprite);
    }

    return group;
  }, []);

  const sortedLabels = useMemo(() => {
    return Object.entries(labelCounts).sort((a, b) => b[1] - a[1]);
  }, [labelCounts]);

  const canvasBg = isDark ? '#0a0a0f' : '#f8fafc';
  const linkColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const arrowColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';

  const modeButtonClass = (active) =>
    `px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide rounded border cursor-pointer transition-all ${
      active
        ? 'bg-indigo-100 dark:bg-indigo-600/15 border-indigo-300 dark:border-indigo-600/40 text-indigo-600 dark:text-indigo-300'
        : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-500 hover:text-slate-700 dark:hover:text-slate-400 hover:border-slate-300 dark:hover:border-white/15'
    }`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)] bg-slate-50 dark:bg-slate-950 rounded-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Loading graph from Neo4j...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={outerRef}
      className={`relative bg-slate-50 dark:bg-slate-950 overflow-hidden ${
        isFullscreen ? 'w-screen h-screen' : 'h-[calc(100vh-12rem)] rounded-lg'
      }`}
      style={{ fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace" }}
    >

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-white/5 flex items-center px-5 z-20 gap-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-wide">MESULO KG</h2>
        <div className="w-px h-5 bg-slate-200 dark:bg-white/10" />
        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex gap-3">
          {stats.shownNodes < stats.totalNodes
            ? <><span className="text-slate-600 dark:text-slate-400">{stats.shownNodes}</span> / {stats.totalNodes} nodes</>
            : <><span className="text-slate-600 dark:text-slate-400">{stats.totalNodes}</span> nodes</>}
          <span>&middot;</span>
          <span className="text-slate-600 dark:text-slate-400">{stats.shownLinks}</span> relationships
          <span>&middot;</span>
          <span className="text-slate-600 dark:text-slate-400">{stats.types}</span> types
        </div>

        <div className="flex-1" />

        {/* 2D / 3D Toggle */}
        <div className="flex items-center gap-1">
          <button
            className={modeButtonClass(viewMode === '2d')}
            style={{ fontFamily: 'inherit' }}
            onClick={() => setViewMode('2d')}
          >
            2D
          </button>
          <button
            className={`${modeButtonClass(viewMode === '3d')} ${!webgl.supported ? 'opacity-40 cursor-not-allowed' : ''}`}
            style={{ fontFamily: 'inherit' }}
            disabled={!webgl.supported}
            title={webgl.supported ? 'Switch to 3D view' : 'WebGL not available in this browser'}
            onClick={() => webgl.supported && setViewMode('3d')}
          >
            3D
          </button>
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-white/10" />

        {/* Fullscreen Button */}
        <button
          className="p-1.5 rounded border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-white/15 transition-all"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          )}
        </button>
      </div>

      {/* Legend Panel */}
      <div className="absolute top-16 left-4 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-lg p-3.5 z-10 min-w-[200px]">
        <h3 className="text-[10px] uppercase tracking-[1.5px] text-slate-400 dark:text-slate-500 mb-2.5">Node Types</h3>
        {sortedLabels.map(([label, count]) => (
          <div
            key={label}
            className={`flex items-center gap-2.5 py-1 cursor-pointer select-none transition-opacity ${hiddenLabels.has(label) ? 'opacity-30' : ''}`}
            onClick={() => toggleLabel(label)}
          >
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: NODE_COLORS[label] || DEFAULT_COLOR }} />
            <div className="text-xs text-slate-700 dark:text-slate-300 flex-1">{label}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">{count}</div>
            <input
              type="number"
              min="0"
              placeholder="all"
              className="w-12 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded text-slate-700 dark:text-slate-300 text-[10px] px-1 py-0.5 text-right outline-none focus:border-indigo-500/50"
              style={{ fontFamily: 'inherit' }}
              value={nodeLimits[label] ?? ''}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                const val = e.target.value.trim();
                updateNodeLimit(label, val === '' ? null : val);
              }}
            />
          </div>
        ))}
        <div className="text-[9px] text-slate-400 dark:text-slate-600 mt-2 leading-snug">Click to hide. Set max to limit nodes.</div>
      </div>

      {/* Detail Panel */}
      {selectedNode && (
        <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}

      {/* Graph Canvas */}
      <div ref={containerRef} className="w-full h-full">
        {viewMode === '2d' ? (
          <ForceGraph2D
            ref={graphRef2D}
            graphData={filteredData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor={canvasBg}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
            linkColor={() => linkColor}
            linkWidth={0.5}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            linkDirectionalArrowColor={() => arrowColor}
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleBackgroundClick}
            d3AlphaDecay={0.04}
            d3VelocityDecay={0.3}
            warmupTicks={80}
            cooldownTicks={120}
          />
        ) : (
          <WebGLErrorBoundary onFallback={() => setViewMode('2d')}>
            <ForceGraph3D
              ref={graphRef3D}
              graphData={filteredData}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor={canvasBg}
              nodeThreeObject={nodeThreeObjectFn}
              linkColor={() => linkColor}
              linkWidth={0.3}
              linkDirectionalArrowLength={2.5}
              linkDirectionalArrowRelPos={1}
              linkDirectionalArrowColor={() => arrowColor}
              onNodeClick={handleNodeClick}
              onBackgroundClick={handleBackgroundClick}
              d3AlphaDecay={0.04}
              d3VelocityDecay={0.3}
              warmupTicks={80}
              cooldownTicks={120}
            />
          </WebGLErrorBoundary>
        )}
      </div>

      {/* Query Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/92 dark:bg-slate-950/92 backdrop-blur-md border-t border-slate-200 dark:border-white/5 z-20">
        <button
          className="absolute -top-8 right-5 bg-white/90 dark:bg-slate-950/85 border border-slate-200 dark:border-white/[0.08] border-b-0 rounded-t-md text-slate-500 dark:text-slate-400 px-3.5 py-1.5 text-[11px] tracking-wide cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
          style={{ fontFamily: 'inherit' }}
          onClick={() => setQueryOpen(v => !v)}
        >
          QUERY
        </button>

        {queryOpen && (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-5 pt-2.5">
              <button
                className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wide rounded border cursor-pointer transition-all ${
                  queryMode === 'natural'
                    ? 'bg-indigo-100 dark:bg-indigo-600/15 border-indigo-300 dark:border-indigo-600/40 text-indigo-600 dark:text-indigo-300'
                    : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-500 hover:text-slate-700 dark:hover:text-slate-400 hover:border-slate-300 dark:hover:border-white/15'
                }`}
                style={{ fontFamily: 'inherit' }}
                onClick={() => setQueryMode('natural')}
              >
                Natural Language
              </button>
              <button
                className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wide rounded border cursor-pointer transition-all ${
                  queryMode === 'cypher'
                    ? 'bg-indigo-100 dark:bg-indigo-600/15 border-indigo-300 dark:border-indigo-600/40 text-indigo-600 dark:text-indigo-300'
                    : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-500 hover:text-slate-700 dark:hover:text-slate-400 hover:border-slate-300 dark:hover:border-white/15'
                }`}
                style={{ fontFamily: 'inherit' }}
                onClick={() => setQueryMode('cypher')}
              >
                Cypher
              </button>

              {queryMode === 'natural' && (
                <select
                  className="bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded text-slate-500 dark:text-slate-400 text-[11px] py-1 px-2 outline-none cursor-pointer max-w-[340px]"
                  style={{ fontFamily: 'inherit' }}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      setQueryInput(e.target.value);
                      setQueryMode('natural');
                    }
                  }}
                >
                  <option value="">Try an example...</option>
                  {NL_EXAMPLES.map(group => [
                    <option key={`g-${group.group}`} disabled>── {group.group} ──</option>,
                    ...group.items.map(item => (
                      <option key={item} value={item}>{item}</option>
                    )),
                  ])}
                </select>
              )}
              <div className="flex-1" />
            </div>

            {/* Generated Cypher */}
            {generatedCypher && (
              <div className="px-5 mt-1.5">
                <div className="text-[9px] uppercase tracking-[1px] text-slate-400 dark:text-slate-600 mb-1">Generated Cypher</div>
                <pre className="bg-emerald-50 dark:bg-emerald-500/[0.06] border border-emerald-200 dark:border-emerald-500/15 rounded p-2 text-[11px] text-emerald-700 dark:text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {generatedCypher}
                </pre>
              </div>
            )}

            {/* Input */}
            <div className="flex gap-3 px-5 py-2 items-start">
              <textarea
                className="flex-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-md text-slate-800 dark:text-slate-200 text-xs p-2.5 resize-y min-h-[40px] max-h-[200px] outline-none focus:border-indigo-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                style={{ fontFamily: 'inherit' }}
                rows={1}
                placeholder={queryMode === 'natural' ? 'Ask a question about your data...' : 'MATCH (n) RETURN n LIMIT 10'}
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="bg-indigo-600 text-white rounded-md px-5 py-2.5 text-xs font-medium cursor-pointer whitespace-nowrap transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'inherit' }}
                disabled={queryRunning}
                onClick={handleRunQuery}
              >
                {queryRunning ? (queryMode === 'natural' ? 'Thinking...' : 'Running...') : 'Run'}
              </button>
            </div>

            {/* Results */}
            {(queryResults || queryError) && (
              <div className="max-h-[200px] overflow-y-auto px-5 pb-3 text-[11px]">
                <pre className={`bg-slate-100 dark:bg-white/[0.03] rounded-md p-3 overflow-x-auto leading-relaxed ${queryError ? 'text-red-500 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {queryError || JSON.stringify(queryResults, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DetailPanel({ node, onClose }) {
  const videoEntries = [];
  const regularEntries = [];

  Object.entries(node.props || {}).forEach(([key, val]) => {
    const strVal = String(val || '');
    if (SKIP_KEYS.has(key)) return;
    const isVideo = VIDEO_KEYS.has(key) && strVal.startsWith('http') && /\.(mp4|webm|mov|ogg)(\?|$)/i.test(strVal);
    if (isVideo) {
      videoEntries.push([key, strVal]);
    } else {
      regularEntries.push([key, val]);
    }
  });

  return (
    <div className="absolute top-16 right-4 w-[300px] bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-lg p-4 z-10 max-h-[calc(100%-11rem)] overflow-y-auto">
      <button
        className="absolute top-3 right-3 bg-transparent border-none text-slate-400 dark:text-slate-500 cursor-pointer text-base hover:text-slate-700 dark:hover:text-slate-300"
        onClick={onClose}
      >
        &times;
      </button>

      <h3 className="text-[10px] uppercase tracking-[1.5px] mb-1.5" style={{ color: NODE_COLORS[node.label] || DEFAULT_COLOR }}>
        {node.label}
      </h3>
      <div className="text-[15px] font-semibold text-slate-800 dark:text-slate-200 mb-3 break-words">{node.name}</div>

      {videoEntries.map(([key, url]) => (
        <div key={key}>
          <div className="text-[9px] uppercase tracking-[1px] text-slate-400 dark:text-slate-500 mb-1 mt-2">{key}</div>
          <div className="w-full rounded-md overflow-hidden border border-slate-200 dark:border-white/[0.08]">
            <video
              src={url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full block bg-slate-100 dark:bg-white/[0.03]"
              style={{ aspectRatio: '3 / 4', objectFit: 'cover' }}
              onError={(e) => {
                e.target.parentElement.innerHTML = '<div style="padding:12px;font-size:10px;color:#6b7280;text-align:center;">Could not load video</div>';
              }}
            />
          </div>
        </div>
      ))}

      {regularEntries.map(([key, val]) => {
        const displayed = typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val || '—');
        return (
          <div key={key} className="flex justify-between py-1 border-b border-slate-100 dark:border-white/[0.04] text-[11px]">
            <span className="text-slate-400 dark:text-slate-500">{key}</span>
            <span className="text-slate-700 dark:text-slate-300 text-right max-w-[180px] break-all">{displayed}</span>
          </div>
        );
      })}
    </div>
  );
}
