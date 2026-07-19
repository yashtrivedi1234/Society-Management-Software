import { useMemo } from 'react';
import { isLiveMode } from '../config/appMode';
import { useAuth } from '../context/AuthContext';
import {
  useGetMembersQuery,
  useGetExpensesQuery,
  useGetPaymentsQuery,
} from '../store/apiSlice';
import {
  normalizeMember,
  normalizeExpense,
  normalizePayment,
} from '../utils/financeDerived';

/**
 * RTK Query lists for management screens (members / payments / expenses),
 * normalized for the UI. Skips society-wide lists for resident accounts in live mode.
 */
export function useManagementLists() {
  const { user } = useAuth();
  const skip = isLiveMode && (!user || user.role === 'member');

  const membersQ = useGetMembersQuery(undefined, { skip });
  const expensesQ = useGetExpensesQuery(undefined, { skip });
  const paymentsQ = useGetPaymentsQuery(undefined, { skip });

  const members = useMemo(
    () => (membersQ.data || []).map(normalizeMember),
    [membersQ.data]
  );
  const expenses = useMemo(
    () => (expensesQ.data || []).map(normalizeExpense),
    [expensesQ.data]
  );
  const payments = useMemo(
    () => (paymentsQ.data || []).map(normalizePayment),
    [paymentsQ.data]
  );

  const isLoading = membersQ.isLoading || expensesQ.isLoading || paymentsQ.isLoading;
  const loadError =
    membersQ.error?.data?.message ||
    expensesQ.error?.data?.message ||
    paymentsQ.error?.data?.message ||
    '';

  const reloadData = () => {
    if (skip) return;
    membersQ.refetch();
    expensesQ.refetch();
    paymentsQ.refetch();
  };

  return {
    members,
    expenses,
    payments,
    isLoading,
    loadError,
    reloadData,
    skip,
  };
}
