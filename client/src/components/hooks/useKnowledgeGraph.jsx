import { useState, useEffect, useCallback, useMemo } from 'react';
import Axios from 'axios';
import { useAPI } from 'components/lib';

const DEFAULT_LIMITS = {
  ABTestEvent: 100,
  AnalyticsEvent: 100,
  Session: 50,
};

export function useKnowledgeGraph() {

  const { data: rawData, loading } = useAPI('/api/knowledge-graph/graph');

  const graphData = useMemo(() => {
    if (!rawData) return { nodes: [], links: [] };
    return {
      nodes: rawData.nodes || [],
      links: rawData.links || [],
    };
  }, [rawData]);

  const [hiddenLabels, setHiddenLabels] = useState(new Set());
  const [nodeLimits, setNodeLimits] = useState({ ...DEFAULT_LIMITS });
  const [queryMode, setQueryMode] = useState('natural');
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryResults, setQueryResults] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [generatedCypher, setGeneratedCypher] = useState(null);

  const toggleLabel = useCallback((label) => {
    setHiddenLabels(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const updateNodeLimit = useCallback((label, value) => {
    setNodeLimits(prev => {
      const next = { ...prev };
      if (value === null || value === undefined || value === '') {
        delete next[label];
      } else {
        next[label] = parseInt(value, 10);
      }
      return next;
    });
  }, []);

  const filterGraphData = useCallback(() => {
    const labelCounts = {};
    const visibleNodes = [];

    for (const n of graphData.nodes) {
      if (hiddenLabels.has(n.label)) continue;
      const limit = nodeLimits[n.label];
      if (limit !== undefined) {
        labelCounts[n.label] = (labelCounts[n.label] || 0) + 1;
        if (labelCounts[n.label] > limit) continue;
      }
      visibleNodes.push(n);
    }

    const visibleIds = new Set(visibleNodes.map(n => n.id));
    const visibleLinks = graphData.links.filter(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      return visibleIds.has(sId) && visibleIds.has(tId);
    });

    return { nodes: visibleNodes, links: visibleLinks };
  }, [graphData, hiddenLabels, nodeLimits]);

  const labelCounts = useMemo(() => {
    const counts = {};
    graphData.nodes.forEach(n => {
      counts[n.label] = (counts[n.label] || 0) + 1;
    });
    return counts;
  }, [graphData]);

  const stats = useMemo(() => {
    const filtered = filterGraphData();
    const totalNodes = graphData.nodes.length;
    const shownNodes = filtered.nodes.length;
    const shownLinks = filtered.links.length;
    const types = [...new Set(graphData.nodes.map(n => n.label))].length;
    return { totalNodes, shownNodes, shownLinks, types };
  }, [graphData, filterGraphData]);

  const runCypherQuery = useCallback(async (query) => {
    setQueryRunning(true);
    setQueryError(null);
    setQueryResults(null);
    setGeneratedCypher(null);

    try {
      const res = await Axios.post('/api/knowledge-graph/query', { query });
      const d = res.data?.data;
      if (d?.error) {
        setQueryError(d.error);
      } else {
        setQueryResults(d?.results);
      }
    }
    catch (err) {
      setQueryError(err.response?.data?.data?.error || err.message);
    }
    finally {
      setQueryRunning(false);
    }
  }, []);

  const runNLQuery = useCallback(async (question) => {
    setQueryRunning(true);
    setQueryError(null);
    setQueryResults(null);
    setGeneratedCypher(null);

    try {
      const res = await Axios.post('/api/knowledge-graph/nl-query', { question });
      const d = res.data?.data;
      if (d?.cypher) setGeneratedCypher(d.cypher);
      if (d?.error) {
        setQueryError(d.error);
      } else {
        setQueryResults(d?.results);
      }
    }
    catch (err) {
      const d = err.response?.data?.data;
      if (d?.cypher) setGeneratedCypher(d.cypher);
      setQueryError(d?.error || err.message);
    }
    finally {
      setQueryRunning(false);
    }
  }, []);

  return {
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
  };
}
