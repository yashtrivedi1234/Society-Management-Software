import { apiRequest } from './apiClient';
import { isLiveMode } from '../config/appMode';
import * as demo from './demoBackend';

export const listBudgetsApi = async (financialYear) =>
  isLiveMode
    ? (await apiRequest(`/finance/budgets${financialYear ? `?financialYear=${encodeURIComponent(financialYear)}` : ''}`)).data || []
    : demo.list('budgets').filter((b) => !financialYear || b.financialYear === financialYear);

export const createBudgetApi = async (payload) =>
  isLiveMode
    ? (await apiRequest('/finance/budgets', { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.create('budgets', { ...payload }, 'bg');

export const getBudgetVarianceApi = async (financialYear) =>
  isLiveMode
    ? (await apiRequest(`/finance/budgets/variance?financialYear=${encodeURIComponent(financialYear)}`)).data || []
    : demo.budgetVariance();

export const listReconciliationApi = async (financialYear) =>
  isLiveMode
    ? (await apiRequest(`/finance/reconciliation${financialYear ? `?financialYear=${encodeURIComponent(financialYear)}` : ''}`)).data || []
    : demo.list('reconciliation');
export const createReconciliationApi = async (payload) =>
  isLiveMode
    ? (await apiRequest('/finance/reconciliation', { method: 'POST', body: JSON.stringify(payload) })).data
    : demo.create('reconciliation', { status: 'unmatched', ...payload }, 'rc');
export const autoMatchReconciliationApi = async () =>
  isLiveMode ? (await apiRequest('/finance/reconciliation/auto-match', { method: 'POST' })).data : demo.autoMatch();

export const getComplianceSummaryApi = async ({ month, financialYear } = {}) => {
  if (!isLiveMode) return demo.complianceSummary();
  const query = month
    ? `month=${encodeURIComponent(month)}`
    : financialYear
      ? `financialYear=${encodeURIComponent(financialYear)}`
      : '';
  return (await apiRequest(`/finance/compliance-summary${query ? `?${query}` : ''}`)).data;
};
