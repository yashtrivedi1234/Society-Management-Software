import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import * as complaints from '../services/complaintService';
import * as notices from '../services/noticeService';
import * as visitors from '../services/visitorService';
import * as facilities from '../services/facilityService';
import * as governance from '../services/governanceService';
import * as operations from '../services/operationsService';
import * as finance from '../services/financeService';
import * as product from '../services/productService';
import * as members from '../services/memberService';
import * as payments from '../services/paymentService';
import * as expenses from '../services/expenseService';
import * as portal from '../services/portalService';
import * as notifications from '../services/notificationService';
import * as invoice from '../services/invoiceService';

// Wrap a service-function promise into RTK Query's { data } / { error } result shape.
// The underlying services already handle live (HTTP) vs demo (in-memory) modes.
const run = async (promise) => {
  try {
    return { data: await promise };
  } catch (e) {
    return { error: { status: 'CUSTOM_ERROR', data: { message: e?.message || 'Request failed' } } };
  }
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: [
    'Complaint', 'Notice', 'Visitor', 'Facility', 'FacilityBooking',
    'Poll', 'Event', 'Announcement',
    'Parking', 'Staff', 'Parcel', 'Document', 'EmergencyAlert',
    'Budget', 'Reconciliation', 'Compliance',
    'ProductSettings', 'Backup',
    'Member', 'Payment', 'Expense',
    'PortalSummary', 'PortalPayment', 'PortalComplaint', 'Notification', 'Invoice',
    'PortalNotice', 'PortalDocument', 'PortalVisitor',
  ],
  endpoints: (builder) => ({
    // ---------- Complaints ----------
    getComplaints: builder.query({ queryFn: () => run(complaints.listComplaintsApi()), providesTags: ['Complaint'] }),
    createComplaint: builder.mutation({ queryFn: (body) => run(complaints.createComplaintApi(body)), invalidatesTags: ['Complaint'] }),
    updateComplaintStatus: builder.mutation({ queryFn: ({ id, status }) => run(complaints.updateComplaintStatusApi(id, status)), invalidatesTags: ['Complaint'] }),
    deleteComplaint: builder.mutation({ queryFn: (id) => run(complaints.deleteComplaintApi(id)), invalidatesTags: ['Complaint'] }),

    // ---------- Notices ----------
    getNotices: builder.query({ queryFn: () => run(notices.listNoticesApi()), providesTags: ['Notice'] }),
    createNotice: builder.mutation({ queryFn: (body) => run(notices.createNoticeApi(body)), invalidatesTags: ['Notice'] }),
    updateNotice: builder.mutation({ queryFn: ({ id, payload }) => run(notices.updateNoticeApi(id, payload)), invalidatesTags: ['Notice'] }),
    deleteNotice: builder.mutation({ queryFn: (id) => run(notices.deleteNoticeApi(id)), invalidatesTags: ['Notice'] }),

    // ---------- Visitors ----------
    getVisitors: builder.query({ queryFn: () => run(visitors.listVisitorsApi()), providesTags: ['Visitor'] }),
    createVisitor: builder.mutation({ queryFn: (body) => run(visitors.createVisitorApi(body)), invalidatesTags: ['Visitor'] }),
    updateVisitorStatus: builder.mutation({ queryFn: ({ id, status }) => run(visitors.updateVisitorStatusApi(id, status)), invalidatesTags: ['Visitor'] }),
    deleteVisitor: builder.mutation({ queryFn: (id) => run(visitors.deleteVisitorApi(id)), invalidatesTags: ['Visitor'] }),

    // ---------- Facilities ----------
    getFacilities: builder.query({ queryFn: () => run(facilities.listFacilitiesApi()), providesTags: ['Facility'] }),
    getFacilityBookings: builder.query({ queryFn: () => run(facilities.listFacilityBookingsApi()), providesTags: ['FacilityBooking'] }),
    createFacilityBooking: builder.mutation({ queryFn: (body) => run(facilities.createFacilityBookingApi(body)), invalidatesTags: ['FacilityBooking'] }),
    updateFacilityBookingStatus: builder.mutation({ queryFn: ({ id, status }) => run(facilities.updateFacilityBookingStatusApi(id, status)), invalidatesTags: ['FacilityBooking'] }),

    // ---------- Governance ----------
    getPolls: builder.query({ queryFn: () => run(governance.listPollsApi()), providesTags: ['Poll'] }),
    createPoll: builder.mutation({ queryFn: (body) => run(governance.createPollApi(body)), invalidatesTags: ['Poll'] }),
    votePoll: builder.mutation({ queryFn: ({ id, payload }) => run(governance.votePollApi(id, payload)), invalidatesTags: ['Poll'] }),
    closePoll: builder.mutation({ queryFn: (id) => run(governance.closePollApi(id)), invalidatesTags: ['Poll'] }),
    getEvents: builder.query({ queryFn: () => run(governance.listEventsApi()), providesTags: ['Event'] }),
    createEvent: builder.mutation({ queryFn: (body) => run(governance.createEventApi(body)), invalidatesTags: ['Event'] }),
    rsvpEvent: builder.mutation({ queryFn: ({ id, payload }) => run(governance.rsvpEventApi(id, payload)), invalidatesTags: ['Event'] }),
    getAnnouncements: builder.query({ queryFn: () => run(governance.listAnnouncementsApi()), providesTags: ['Announcement'] }),
    createAnnouncement: builder.mutation({ queryFn: (body) => run(governance.createAnnouncementApi(body)), invalidatesTags: ['Announcement'] }),
    escalateComplaints: builder.mutation({ queryFn: () => run(governance.escalateComplaintsApi()), invalidatesTags: ['Complaint'] }),

    // ---------- Operations ----------
    getParking: builder.query({ queryFn: () => run(operations.listParkingApi()), providesTags: ['Parking'] }),
    createParking: builder.mutation({ queryFn: (body) => run(operations.createParkingApi(body)), invalidatesTags: ['Parking'] }),
    getStaff: builder.query({ queryFn: () => run(operations.listStaffApi()), providesTags: ['Staff'] }),
    createStaff: builder.mutation({ queryFn: (body) => run(operations.createStaffApi(body)), invalidatesTags: ['Staff'] }),
    updateStaffAttendance: builder.mutation({ queryFn: ({ id, payload }) => run(operations.updateStaffAttendanceApi(id, payload)), invalidatesTags: ['Staff'] }),
    getParcels: builder.query({ queryFn: () => run(operations.listParcelsApi()), providesTags: ['Parcel'] }),
    createParcel: builder.mutation({ queryFn: (body) => run(operations.createParcelApi(body)), invalidatesTags: ['Parcel'] }),
    markParcelDelivered: builder.mutation({ queryFn: (id) => run(operations.markParcelDeliveredApi(id)), invalidatesTags: ['Parcel'] }),
    getDocuments: builder.query({ queryFn: () => run(operations.listDocumentsApi()), providesTags: ['Document'] }),
    createDocument: builder.mutation({ queryFn: (body) => run(operations.createDocumentApi(body)), invalidatesTags: ['Document'] }),
    getEmergencyAlerts: builder.query({ queryFn: () => run(operations.listEmergencyAlertsApi()), providesTags: ['EmergencyAlert'] }),
    createEmergencyAlert: builder.mutation({ queryFn: (body) => run(operations.createEmergencyAlertApi(body)), invalidatesTags: ['EmergencyAlert'] }),
    updateEmergencyStatus: builder.mutation({ queryFn: ({ id, payload }) => run(operations.updateEmergencyStatusApi(id, payload)), invalidatesTags: ['EmergencyAlert'] }),

    // ---------- Finance ----------
    getBudgets: builder.query({ queryFn: (financialYear) => run(finance.listBudgetsApi(financialYear)), providesTags: ['Budget'] }),
    createBudget: builder.mutation({ queryFn: (body) => run(finance.createBudgetApi(body)), invalidatesTags: ['Budget'] }),
    getBudgetVariance: builder.query({ queryFn: (financialYear) => run(finance.getBudgetVarianceApi(financialYear)), providesTags: ['Budget'] }),
    getReconciliation: builder.query({ queryFn: (financialYear) => run(finance.listReconciliationApi(financialYear)), providesTags: ['Reconciliation'] }),
    createReconciliation: builder.mutation({ queryFn: (body) => run(finance.createReconciliationApi(body)), invalidatesTags: ['Reconciliation'] }),
    autoMatchReconciliation: builder.mutation({ queryFn: () => run(finance.autoMatchReconciliationApi()), invalidatesTags: ['Reconciliation'] }),
    getComplianceSummary: builder.query({ queryFn: (args) => run(finance.getComplianceSummaryApi(args)), providesTags: ['Compliance'] }),

    // ---------- Product settings ----------
    getProductSettings: builder.query({ queryFn: () => run(product.getProductSettingsApi()), providesTags: ['ProductSettings'] }),
    updateProductSettings: builder.mutation({ queryFn: (body) => run(product.updateProductSettingsApi(body)), invalidatesTags: ['ProductSettings'] }),
    getBackups: builder.query({ queryFn: () => run(product.listBackupsApi()), providesTags: ['Backup'] }),
    triggerBackup: builder.mutation({ queryFn: (body) => run(product.triggerBackupApi(body)), invalidatesTags: ['Backup'] }),

    // ---------- Members ----------
    getMembers: builder.query({ queryFn: () => run(members.listMembersApi()), providesTags: ['Member'] }),
    createMember: builder.mutation({ queryFn: (body) => run(members.createMemberApi(body)), invalidatesTags: ['Member'] }),
    createMemberLogin: builder.mutation({ queryFn: ({ id, password }) => run(members.createMemberLoginApi(id, password)), invalidatesTags: ['Member'] }),
    updateMember: builder.mutation({ queryFn: ({ id, payload }) => run(members.updateMemberApi(id, payload)), invalidatesTags: ['Member'] }),
    deleteMember: builder.mutation({ queryFn: (id) => run(members.deleteMemberApi(id)), invalidatesTags: ['Member'] }),

    // ---------- Payments ----------
    getPayments: builder.query({ queryFn: (month) => run(payments.listPaymentsApi(month)), providesTags: ['Payment'] }),
    markPaymentPaid: builder.mutation({ queryFn: ({ id, payload }) => run(payments.markPaymentPaidApi(id, payload)), invalidatesTags: ['Payment', 'Compliance'] }),

    // ---------- Expenses ----------
    getExpenses: builder.query({ queryFn: (month) => run(expenses.listExpensesApi(month)), providesTags: ['Expense'] }),
    createExpense: builder.mutation({ queryFn: (body) => run(expenses.createExpenseApi(body)), invalidatesTags: ['Expense'] }),
    deleteExpense: builder.mutation({ queryFn: (id) => run(expenses.deleteExpenseApi(id)), invalidatesTags: ['Expense'] }),

    // ---------- Resident portal ----------
    getMySummary: builder.query({ queryFn: (month) => run(portal.getMySummaryApi(month)), providesTags: ['PortalSummary'] }),
    getMyPayments: builder.query({ queryFn: () => run(portal.getMyPaymentsApi()), providesTags: ['PortalPayment'] }),
    getMyComplaints: builder.query({ queryFn: () => run(portal.getMyComplaintsApi()), providesTags: ['PortalComplaint'] }),
    createMyComplaint: builder.mutation({ queryFn: (body) => run(portal.createMyComplaintApi(body)), invalidatesTags: ['PortalComplaint', 'PortalSummary'] }),
    getMyNotices: builder.query({ queryFn: () => run(portal.getMyNoticesApi()), providesTags: ['PortalNotice'] }),
    getMyDocuments: builder.query({ queryFn: () => run(portal.getMyDocumentsApi()), providesTags: ['PortalDocument'] }),
    getMyVisitors: builder.query({ queryFn: () => run(portal.getMyVisitorsApi()), providesTags: ['PortalVisitor'] }),
    preApproveVisitor: builder.mutation({ queryFn: (body) => run(portal.preApproveVisitorApi(body)), invalidatesTags: ['PortalVisitor'] }),

    // ---------- Notifications ----------
    getNotifications: builder.query({ queryFn: () => run(notifications.listNotificationsApi()), providesTags: ['Notification'] }),
    markNotificationRead: builder.mutation({ queryFn: (id) => run(notifications.markNotificationReadApi(id)), invalidatesTags: ['Notification'] }),
    markAllNotificationsRead: builder.mutation({ queryFn: () => run(notifications.markAllNotificationsReadApi()), invalidatesTags: ['Notification'] }),

    // ---------- Invoice ----------
    getInvoice: builder.query({ queryFn: ({ flatNumber, month }) => run(invoice.getInvoiceApi(flatNumber, month)), providesTags: ['Invoice'] }),

    // ---------- Device token (product) ----------
    registerDeviceToken: builder.mutation({ queryFn: (body) => run(product.registerDeviceTokenApi(body)) }),
  }),
});

export const {
  // complaints
  useGetComplaintsQuery, useCreateComplaintMutation, useUpdateComplaintStatusMutation, useDeleteComplaintMutation,
  // notices
  useGetNoticesQuery, useCreateNoticeMutation, useUpdateNoticeMutation, useDeleteNoticeMutation,
  // visitors
  useGetVisitorsQuery, useCreateVisitorMutation, useUpdateVisitorStatusMutation, useDeleteVisitorMutation,
  // facilities
  useGetFacilitiesQuery, useGetFacilityBookingsQuery, useCreateFacilityBookingMutation, useUpdateFacilityBookingStatusMutation,
  // governance
  useGetPollsQuery, useCreatePollMutation, useVotePollMutation, useClosePollMutation,
  useGetEventsQuery, useCreateEventMutation, useRsvpEventMutation,
  useGetAnnouncementsQuery, useCreateAnnouncementMutation, useEscalateComplaintsMutation,
  // operations
  useGetParkingQuery, useCreateParkingMutation,
  useGetStaffQuery, useCreateStaffMutation, useUpdateStaffAttendanceMutation,
  useGetParcelsQuery, useCreateParcelMutation, useMarkParcelDeliveredMutation,
  useGetDocumentsQuery, useCreateDocumentMutation,
  useGetEmergencyAlertsQuery, useCreateEmergencyAlertMutation, useUpdateEmergencyStatusMutation,
  // finance
  useGetBudgetsQuery, useCreateBudgetMutation, useGetBudgetVarianceQuery,
  useGetReconciliationQuery, useCreateReconciliationMutation, useAutoMatchReconciliationMutation,
  useGetComplianceSummaryQuery,
  // product
  useGetProductSettingsQuery, useUpdateProductSettingsMutation, useGetBackupsQuery, useTriggerBackupMutation,
  // members
  useGetMembersQuery, useCreateMemberMutation, useCreateMemberLoginMutation, useUpdateMemberMutation, useDeleteMemberMutation,
  // payments
  useGetPaymentsQuery, useMarkPaymentPaidMutation,
  // expenses
  useGetExpensesQuery, useCreateExpenseMutation, useDeleteExpenseMutation,
  // resident portal
  useGetMySummaryQuery, useGetMyPaymentsQuery, useGetMyComplaintsQuery, useCreateMyComplaintMutation,
  useGetMyNoticesQuery, useGetMyDocumentsQuery, useGetMyVisitorsQuery, usePreApproveVisitorMutation,
  // notifications
  useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation,
  // invoice
  useGetInvoiceQuery,
  // device token
  useRegisterDeviceTokenMutation,
} = api;
