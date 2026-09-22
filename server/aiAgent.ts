import { GoogleGenAI, Type } from '@google/genai';
import { AIReport, ReportSummary } from '../src/types/pos';
import { dbStore } from './store';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function generateAIReport(
  period: 'daily' | 'weekly' | 'monthly' | 'custom',
  startDate: string,
  endDate: string,
  userName: string = 'Store Admin'
): Promise<AIReport> {
  const summary = dbStore.aggregateSalesSummary(startDate, endDate, period);
  const settings = dbStore.getSettings();
  const allProducts = dbStore.getProducts();

  const inventorySummary = {
    totalSkus: allProducts.length,
    lowStockAlertsCount: summary.lowStockProducts.length,
    lowStockList: summary.lowStockProducts,
  };

  const contextData = {
    storeName: settings.storeName,
    period,
    startDate,
    endDate,
    metrics: summary,
    inventory: inventorySummary,
  };

  const ai = getGeminiClient();

  if (!ai) {
    // High-quality deterministic fallback if API key is not yet set
    return createRuleBasedReport(summary, period, startDate, endDate, userName);
  }

  try {
    const prompt = `You are OmniPOS AI Chief Intelligence Agent analyzing retail store sales & inventory data.
Generate a rigorous, executive-level business intelligence performance report based strictly on the provided JSON data.

Store & Period Context:
${JSON.stringify(contextData, null, 2)}

Instructions:
1. title: A concise, impactful title (e.g., "${period.toUpperCase()} POS Performance & Inventory Audit").
2. executiveSummary: A cohesive 2-3 paragraph plain-English executive summary summarizing revenue, margins, customer throughput, and product momentum.
3. topStrengths: An array of 3 to 5 specific bulleted strengths with numbers/percentages from the data.
4. anomaliesAndRisks: An array of 3 to 5 detected anomalies, margin issues, stockout warnings, dead inventory, or spikes in refunds.
5. actionableRecommendations: An array of 3 to 4 concrete, actionable next steps for the store manager (re-ordering, pricing adjustments, cashier training, promotion bundles).

Return strictly JSON matching the required schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            topStrengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            anomaliesAndRisks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            actionableRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['title', 'executiveSummary', 'topStrengths', 'anomaliesAndRisks', 'actionableRecommendations'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');

    const report: AIReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: parsed.title || `${period.charAt(0).toUpperCase() + period.slice(1)} Performance Audit`,
      period,
      startDate,
      endDate,
      summaryMetrics: summary,
      executiveSummary: parsed.executiveSummary || 'Sales analysis completed.',
      topStrengths: parsed.topStrengths || [],
      anomaliesAndRisks: parsed.anomaliesAndRisks || [],
      actionableRecommendations: parsed.actionableRecommendations || [],
      createdAt: new Date().toISOString(),
      createdBy: userName,
    };

    dbStore.saveReport(report);
    return report;
  } catch (error) {
    console.error('Error generating AI report via Gemini:', error);
    // Fallback gracefully so system never crashes
    const fallbackReport = createRuleBasedReport(summary, period, startDate, endDate, userName);
    dbStore.saveReport(fallbackReport);
    return fallbackReport;
  }
}

export async function askAIAgent(userQuestion: string): Promise<{ answer: string; suggestedQuestions: string[] }> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const recentSummary = dbStore.aggregateSalesSummary(sevenDaysAgo.toISOString(), now.toISOString(), 'weekly');
  const products = dbStore.getProducts();
  const recentSales = dbStore.getSales({}).slice(0, 15);
  const settings = dbStore.getSettings();
  const curr = settings?.currencySymbol || 'PKR ';

  const context = {
    currentDate: now.toISOString(),
    storeSettings: settings,
    storeCurrency: curr,
    weeklySummary: recentSummary,
    totalProductsInCatalog: products.length,
    lowStockCount: recentSummary.lowStockProducts.length,
    lowStockItems: recentSummary.lowStockProducts,
    recentSalesSample: recentSales.map(s => ({
      saleNumber: s.saleNumber,
      total: `${curr}${s.grandTotal.toFixed(2)}`,
      items: s.items.map(i => `${i.productName} (x${i.quantity})`),
      paymentMethod: s.paymentMethod,
      time: s.createdAt,
      status: s.status,
    })),
  };

  const ai = getGeminiClient();

  if (!ai) {
    // Intelligent local response matching common questions
    const q = userQuestion.toLowerCase();
    if (q.includes('top') || q.includes('best')) {
      const topItems = recentSummary.topProductsByRevenue.map(p => `• ${p.name} (${curr}${p.revenue.toFixed(2)}, ${p.quantity} units sold)`).join('\n');
      return {
        answer: `Here are the top revenue-generating products from the past 7 days:\n\n${topItems}\n\nTop performer is ${recentSummary.topProductsByRevenue[0]?.name || 'N/A'}.`,
        suggestedQuestions: [
          'Which products are running low in stock?',
          'What was our total revenue this week?',
          'What is our profit margin?',
        ],
      };
    }
    if (q.includes('stock') || q.includes('low') || q.includes('inventory')) {
      const lowItems = recentSummary.lowStockProducts.map(p => `• ${p.name} (Current: ${p.currentStock}, Alert at: ${p.threshold})`).join('\n');
      return {
        answer: `There are currently ${recentSummary.lowStockProducts.length} items reaching critical stock levels:\n\n${lowItems || 'All products are currently well-stocked!'}\n\nImmediate restocking is recommended.`,
        suggestedQuestions: [
          'What are the top 5 products last week?',
          'Suggest 3 bundle ideas to boost sales',
          'How can we reduce our refund rate?',
        ],
      };
    }
    return {
      answer: `Based on your store data over the last 7 days:\n• Total Revenue: ${curr}${recentSummary.totalRevenue.toFixed(2)}\n• Net Profit: ${curr}${recentSummary.totalProfit.toFixed(2)} (${recentSummary.profitMarginPercent}% margin)\n• Total Completed Orders: ${recentSummary.totalOrders}\n• Average Order Value: ${curr}${recentSummary.averageOrderValue.toFixed(2)}\n• Low Stock Alerts: ${recentSummary.lowStockProducts.length} products`,
      suggestedQuestions: [
        'Top 5 products last week?',
        'Which items are at risk of running out?',
        'Recommend pricing or bundle promotions',
      ],
    };
  }

  try {
    const prompt = `You are OmniPOS AI, an expert retail and inventory intelligence analyst for an in-store POS system.
Answer the user's question directly, accurately, and concisely using the store's real data below.
Currency format: Always use "${curr}" as the currency prefix when mentioning monetary values.

Store Data Context:
${JSON.stringify(context, null, 2)}

User Question: "${userQuestion}"

Requirements:
- Speak directly in a professional, helpful, concise tone.
- Reference specific numbers, product names, revenues, or stock counts when relevant, prefixed with "${curr}".
- At the end of your answer, provide 3 short relevant follow-up questions the store owner or cashier might want to ask next.

Return strictly JSON with keys:
{
  "answer": "Your comprehensive answer with formatting/bullets if needed",
  "suggestedQuestions": ["Question 1", "Question 2", "Question 3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['answer', 'suggestedQuestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return {
      answer: parsed.answer || 'Analysis complete.',
      suggestedQuestions: parsed.suggestedQuestions || [
        'Top 5 products last week?',
        'Which items are low in stock?',
        'What is our profit margin?',
      ],
    };
  } catch (err) {
    console.error('Error answering AI query:', err);
    return {
      answer: `Current store weekly overview: Total revenue is ${curr}${recentSummary.totalRevenue.toFixed(2)} across ${recentSummary.totalOrders} completed orders. Top seller is "${recentSummary.topProductsByRevenue[0]?.name || 'Espresso Roast'}".`,
      suggestedQuestions: [
        'Top 5 products last week?',
        'Which items are low in stock?',
        'What was our average order value?',
      ],
    };
  }
}

function createRuleBasedReport(
  summary: ReportSummary,
  period: 'daily' | 'weekly' | 'monthly' | 'custom',
  startDate: string,
  endDate: string,
  userName: string
): AIReport {
  const curr = dbStore.getSettings()?.currencySymbol || 'PKR ';
  const topProduct = summary.topProductsByRevenue[0];
  const topRevenue = topProduct ? topProduct.revenue : 0;
  const topName = topProduct ? topProduct.name : 'Catalog Products';

  const strengths = [
    `Total gross revenue reached ${curr}${summary.totalRevenue.toFixed(2)} across ${summary.totalOrders} completed transactions.`,
    `Healthy operating margin maintained at ${summary.profitMarginPercent}%, generating ${curr}${summary.totalProfit.toFixed(2)} in gross profit.`,
    `Flagship item "${topName}" generated ${curr}${topRevenue.toFixed(2)} in sales, leading register velocity.`,
  ];

  const risks: string[] = [];
  if (summary.lowStockProducts.length > 0) {
    risks.push(
      `Supply alert: ${summary.lowStockProducts.length} item(s) are below safety stock threshold (${summary.lowStockProducts.map(p => `${p.name} [${p.currentStock} left]`).slice(0, 2).join(', ')}).`
    );
  }
  if (summary.refundedOrdersCount > 0) {
    risks.push(`${summary.refundedOrdersCount} refunded/voided transaction(s) totaled ${curr}${summary.refundedAmount.toFixed(2)} in lost revenue.`);
  } else {
    risks.push('Zero refunds recorded, demonstrating high order fulfillment accuracy.');
  }
  if (summary.bottomProductsByRevenue.length > 0) {
    risks.push(`Slow movers: "${summary.bottomProductsByRevenue[0].name}" registered sluggish sales volume.`);
  }

  const recs = [
    summary.lowStockProducts.length > 0
      ? `Issue purchase orders for ${summary.lowStockProducts[0].name} to prevent impending stockouts.`
      : 'Maintain current safety stock buffers across primary product categories.',
    'Promote bundled pairing between top beverages and bakery items at checkout.',
    'Review cashier register closing balances and monitor card vs cash split.',
  ];

  return {
    id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    title: `${period.toUpperCase()} Store Financial & Velocity Report`,
    period,
    startDate,
    endDate,
    summaryMetrics: summary,
    executiveSummary: `During this ${period} operating window, the store achieved ${curr}${summary.totalRevenue.toFixed(2)} in total volume with an average basket size of ${curr}${summary.averageOrderValue.toFixed(2)}. Customer demand was strongest for high-margin convenience and daily items. Inventory turns reflect steady customer footfall with ${summary.lowStockProducts.length} items requiring restocking.`,
    topStrengths: strengths,
    anomaliesAndRisks: risks,
    actionableRecommendations: recs,
    createdAt: new Date().toISOString(),
    createdBy: userName,
  };
}
