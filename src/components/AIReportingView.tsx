import React, { useState, useEffect, useRef } from 'react';
import { AIReport, AIChatMessage, User, ReportSummary } from '../types/pos';
import { api } from '../services/api';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Send,
  Calendar,
  Clock,
  ChevronRight,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  Trash2,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
} from 'lucide-react';

interface AIReportingViewProps {
  reports: AIReport[];
  currentUser: User | null;
  onRefreshReports: () => Promise<void>;
  currencySymbol?: string;
}

export const AIReportingView: React.FC<AIReportingViewProps> = ({
  reports,
  currentUser,
  onRefreshReports,
  currencySymbol = 'PKR ',
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Selected report to view
  const [selectedReport, setSelectedReport] = useState<AIReport | null>(reports[0] || null);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [isGenerating, setIsGenerating] = useState(false);

  // Chat Q&A state
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: 'Hello! I am your OmniPOS AI Retail Intelligence Analyst. Ask me anything about your sales, product velocity, low stock alerts, or revenue trends.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions: [
        'Top 5 products last week?',
        'Which items are at risk of running out?',
        'What was our total profit margin?',
        'Suggest 3 promotional bundle ideas',
      ],
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reports.length > 0 && !selectedReport) {
      setSelectedReport(reports[0]);
    }
  }, [reports, selectedReport]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, isChatThinking]);

  // Generate Report
  const handleGenerateReport = async (period: 'daily' | 'weekly' | 'monthly') => {
    setIsGenerating(true);
    try {
      const newReport = await api.generateReport(period);
      await onRefreshReports();
      setSelectedReport(newReport);
    } catch (err: any) {
      alert(err.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this cached report?')) return;
    try {
      await api.deleteReport(id);
      await onRefreshReports();
      if (selectedReport?.id === id) {
        setSelectedReport(reports.filter(r => r.id !== id)[0] || null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete report');
    }
  };

  // Send natural-language query to AI
  const handleSendChat = async (questionToSend?: string) => {
    const q = (questionToSend || inputQuestion).trim();
    if (!q || isChatThinking) return;

    const userMsg: AIChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsChatThinking(true);

    try {
      const res = await api.askAI(q);
      const assistantMsg: AIChatMessage = {
        id: `msg_asst_${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: res.suggestedQuestions,
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: AIChatMessage = {
        id: `msg_asst_err_${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an issue analyzing the store records. Please check that the server is online.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatThinking(false);
    }
  };

  const metrics: ReportSummary | undefined = selectedReport?.summaryMetrics;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Report Generator Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-6 text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Google Gemini 3.8 Flash Retail Intelligence</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">AI Sales & Anomaly Reporting Agent</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Real-time automated plain-English audits, margin optimizations, inventory anomalies, and interactive Q&A grounded in your store's POS database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map(p => (
            <button
              key={p}
              disabled={isGenerating}
              onClick={() => {
                setSelectedPeriod(p);
                handleGenerateReport(p);
              }}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 ${
                selectedPeriod === p && isGenerating
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              {isGenerating && selectedPeriod === p ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span className="capitalize">Generate {p} Report</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left is Report Details, Right is Interactive AI Q&A Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / CENTER: Active Report View (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">
          {/* Report Selector Tabs */}
          {reports.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
                Saved Audits:
              </span>
              {reports.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`group relative shrink-0 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    selectedReport?.id === r.id
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <span className="capitalize">{r.period}</span>
                  <span className="text-[10px] opacity-70">
                    {new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  {isAdmin && (
                    <span
                      onClick={e => handleDeleteReport(r.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 ml-1 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedReport ? (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-2">
                  <div>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider border border-emerald-200">
                      {selectedReport.period} audit
                    </span>
                    <h3 className="text-lg font-black text-zinc-900 mt-1">{selectedReport.title}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Period: {new Date(selectedReport.startDate).toLocaleDateString()} – {new Date(selectedReport.endDate).toLocaleDateString()} • Generated by {selectedReport.createdBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{new Date(selectedReport.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Key Metric Gauges */}
                {metrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                    <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                      <div className="text-[10px] uppercase font-bold text-zinc-400">Total Revenue</div>
                      <div className="text-lg font-black text-zinc-900 mt-0.5">
                        {currencySymbol}{metrics.totalRevenue.toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-emerald-50/50 p-3 border border-emerald-100">
                      <div className="text-[10px] uppercase font-bold text-emerald-700">Gross Margin</div>
                      <div className="text-lg font-black text-emerald-800 mt-0.5">
                        {metrics.profitMarginPercent}%
                      </div>
                    </div>
                    <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                      <div className="text-[10px] uppercase font-bold text-zinc-400">Total Orders</div>
                      <div className="text-lg font-black text-zinc-900 mt-0.5">{metrics.totalOrders}</div>
                    </div>
                    <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                      <div className="text-[10px] uppercase font-bold text-zinc-400">Avg Ticket</div>
                      <div className="text-lg font-black text-zinc-900 mt-0.5">
                        {currencySymbol}{metrics.averageOrderValue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Executive Summary Prose */}
                <div className="mt-4 prose prose-sm text-zinc-700 leading-relaxed text-xs">
                  <p className="whitespace-pre-line font-normal">{selectedReport.executiveSummary}</p>
                </div>
              </div>

              {/* Strengths vs Anomalies / Risks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-3">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span>Key Performance Strengths</span>
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-700">
                    {selectedReport.topStrengths.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Anomalies & Risks */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Trend & Anomaly Detection</span>
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-700">
                    {selectedReport.anomaliesAndRisks.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span>Actionable Agent Recommendations</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedReport.actionableRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 text-xs text-zinc-700 flex items-start gap-2.5"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-900 font-mono text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top & Bottom Velocity Items */}
              {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center justify-between">
                      <span>Top 5 Revenue Drivers</span>
                      <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="space-y-2 text-xs">
                      {metrics.topProductsByRevenue.slice(0, 5).map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-zinc-50 last:border-0">
                          <div>
                            <span className="font-semibold text-zinc-800">{p.name}</span>
                            <div className="text-[10px] text-zinc-400">{p.quantity} units sold</div>
                          </div>
                          <span className="font-mono font-bold text-zinc-900">
                            {currencySymbol}{p.revenue.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center justify-between">
                      <span>Bottom Slow Movers</span>
                      <ArrowDownRight className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="space-y-2 text-xs">
                      {metrics.bottomProductsByRevenue.slice(0, 5).map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-zinc-50 last:border-0">
                          <div>
                            <span className="font-semibold text-zinc-800">{p.name}</span>
                            <div className="text-[10px] text-zinc-400">{p.quantity} units sold</div>
                          </div>
                          <span className="font-mono font-bold text-zinc-900">
                            {currencySymbol}{p.revenue.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white text-center p-6">
              <Sparkles className="h-8 w-8 text-zinc-300 mb-2" />
              <h3 className="font-bold text-sm text-zinc-700">No report generated yet</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Click one of the buttons above (Daily, Weekly, Monthly) to generate an AI performance summary.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Chat-Style Q&A Panel in Dashboard (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col rounded-3xl border border-zinc-200 bg-white shadow-xs overflow-hidden h-[740px]">
          {/* Panel Header */}
          <div className="border-b border-zinc-100 bg-zinc-900 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold">OmniPOS AI Agent Chat</h3>
                <p className="text-[10px] text-zinc-400">Natural-language database queries</p>
              </div>
            </div>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Chat Messages */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 text-xs">
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-zinc-900 text-white rounded-br-xs'
                      : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  <span className="block text-[9px] opacity-60 text-right mt-1.5">{msg.timestamp}</span>
                </div>

                {/* Suggested prompt chips */}
                {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[90%]">
                    {msg.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendChat(q)}
                        className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100 hover:border-zinc-400 transition text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isChatThinking && (
              <div className="flex items-center gap-2 rounded-2xl bg-white border border-zinc-200 p-3 max-w-[80%]">
                <Sparkles className="h-4 w-4 text-emerald-500 animate-spin" />
                <span className="text-xs text-zinc-500 font-medium">OmniPOS Agent is analyzing data...</span>
              </div>
            )}
          </div>

          {/* Quick Preset Query Chips */}
          <div className="border-t border-zinc-100 bg-white px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleSendChat('top 5 products last week?')}
              className="shrink-0 rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-200 transition"
            >
              Top 5 products last week?
            </button>
            <button
              onClick={() => handleSendChat('Which items are at risk of running out?')}
              className="shrink-0 rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-200 transition"
            >
              Stockout risks?
            </button>
            <button
              onClick={() => handleSendChat('Suggest 3 promotional bundle ideas')}
              className="shrink-0 rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-200 transition"
            >
              Promotion ideas
            </button>
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendChat();
            }}
            className="border-t border-zinc-200 bg-white p-3 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={e => setInputQuestion(e.target.value)}
              placeholder="Ask anything about sales or stock..."
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs focus:bg-white focus:border-zinc-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isChatThinking}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white disabled:opacity-40 hover:bg-zinc-800 transition active:scale-95 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
