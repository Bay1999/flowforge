import { useState } from 'react';
import axios from 'axios';
import { Sparkles, Wand2, ArrowRight, RotateCcw, Loader2, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  {
    label: 'API → Process → Notify',
    text: 'Fetch user data from an API, process it with a script to filter active users, then send a POST notification to a webhook with the results.',
  },
  {
    label: 'Scheduled Health Check',
    text: 'Call a health check endpoint with GET request, wait 30 seconds, then call it again and compare results with a script.',
  },
  {
    label: 'Multi-step ETL Pipeline',
    text: 'Extract data from a REST API, wait 5 seconds for rate limiting, transform the data using a script to clean and format it, then load it by sending a POST request to the destination API.',
  },
  {
    label: 'Delayed Retry Workflow',
    text: 'Make an HTTP POST request to submit a form, wait 10 seconds, then check the submission status with a GET request and process the response.',
  },
];

const AiWorkflowBuilder = ({ onApply }) => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a more detailed description (at least 10 characters).');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('/api/ai/generate-workflow', {
        description: description.trim(),
      });

      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.message || 'Failed to generate workflow.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (result && onApply) {
      onApply(result);
      setResult(null);
      setDescription('');
    }
  };

  const handleExampleClick = (text) => {
    setDescription(text);
    setResult(null);
    setError(null);
  };

  return (
    <div className="ai-workflow-builder">
      {/* Header */}
      <div className="ai-builder-header">
        <div className="ai-builder-title-row">
          <div className="ai-builder-icon-wrapper">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="ai-builder-title">AI Workflow Builder</h3>
            <p className="ai-builder-subtitle">
              Describe your workflow in plain English and let AI generate the DAG definition
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="ai-builder-body">
        {/* Example Prompts */}
        <div className="ai-builder-examples">
          <div className="ai-builder-examples-label">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Quick examples — click to try:</span>
          </div>
          <div className="ai-builder-examples-grid">
            {EXAMPLE_PROMPTS.map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(example.text)}
                className="ai-builder-example-chip"
                disabled={isGenerating}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="ai-builder-input-area">
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Describe your workflow... e.g., 'Fetch data from the users API, wait 5 seconds, then process the results with a script and send a notification to a webhook'"
            className="ai-builder-textarea"
            rows={4}
            disabled={isGenerating}
          />
          <div className="ai-builder-input-footer">
            <span className="ai-builder-char-count">
              {description.length} / 2000
            </span>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !description.trim()}
              className="ai-builder-generate-btn"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span>Generate Workflow</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="ai-builder-error">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Result Preview */}
        {result && (
          <div className="ai-builder-result">
            <div className="ai-builder-result-header">
              <div className="ai-builder-result-title-row">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <h4 className="ai-builder-result-name">{result.name}</h4>
                  <p className="ai-builder-result-desc">{result.description}</p>
                </div>
              </div>
            </div>

            {/* DAG Summary */}
            <div className="ai-builder-result-stats">
              <div className="ai-builder-stat">
                <span className="ai-builder-stat-value">{result.dag.nodes?.length || 0}</span>
                <span className="ai-builder-stat-label">Nodes</span>
              </div>
              <div className="ai-builder-stat">
                <span className="ai-builder-stat-value">{result.dag.edges?.length || 0}</span>
                <span className="ai-builder-stat-label">Edges</span>
              </div>
              <div className="ai-builder-stat">
                <span className="ai-builder-stat-value">
                  {[...new Set(result.dag.nodes?.map(n => n.type) || [])].length}
                </span>
                <span className="ai-builder-stat-label">Node Types</span>
              </div>
            </div>

            {/* Node List */}
            <div className="ai-builder-result-nodes">
              {result.dag.nodes?.map((node, idx) => (
                <div key={node.id} className="ai-builder-node-item">
                  <div className="ai-builder-node-index">{idx + 1}</div>
                  <div className="ai-builder-node-info">
                    <span className="ai-builder-node-name">{node.name}</span>
                    <span className={`ai-builder-node-type ai-builder-node-type--${node.type}`}>
                      {node.type}
                    </span>
                  </div>
                  {idx < result.dag.nodes.length - 1 && result.dag.edges?.some(e => e.source === node.id) && (
                    <ArrowRight className="h-3 w-3 text-gray-300 ml-auto flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* JSON Preview (collapsed) */}
            <details className="ai-builder-json-details">
              <summary className="ai-builder-json-summary">View raw DAG JSON</summary>
              <pre className="ai-builder-json-preview">
                {JSON.stringify(result.dag, null, 2)}
              </pre>
            </details>

            {/* Action Buttons */}
            <div className="ai-builder-actions">
              <button
                onClick={() => { setResult(null); }}
                className="ai-builder-btn-secondary"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={handleApply}
                className="ai-builder-btn-primary"
              >
                <CheckCircle2 className="h-4 w-4" />
                Apply to Workflow
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiWorkflowBuilder;
