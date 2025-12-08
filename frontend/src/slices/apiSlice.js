import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/api",
  }),
  tagTypes: ["Rfp", "Vendor", "Proposal", "Comparison"],
  endpoints: (builder) => ({
    // RFPs
    createRfpFromText: builder.mutation({
      query: (text) => ({
        url: "/rfp/create-from-text",
        method: "POST",
        body: { text },
      }),
      invalidatesTags: ["Rfp"],
    }),
    getRfpById: builder.query({
      query: (id) => `/rfp/${id}`,
      providesTags: (result, error, id) => [{ type: "Rfp", id }],
    }),
    getRfps: builder.query({
      query: () => "/rfps",
      providesTags: (result) =>
        result?.rfps
          ? [
              ...result.rfps.map((r) => ({ type: "Rfp", id: r._id })),
              { type: "Rfp", id: "LIST" },
            ]
          : [{ type: "Rfp", id: "LIST" }],
    }),

    getVendors: builder.query({
      query: () => "/vendors",
      providesTags: (result) =>
        result?.vendors
          ? [
              ...result.vendors.map((v) => ({ type: "Vendor", id: v._id })),
              { type: "Vendor", id: "LIST" },
            ]
          : [{ type: "Vendor", id: "LIST" }],
    }),
    createVendor: builder.mutation({
      query: (vendor) => ({
        url: "/vendors",
        method: "POST",
        body: vendor,
      }),
      invalidatesTags: [{ type: "Vendor", id: "LIST" }],
    }),

    sendRfpToVendors: builder.mutation({
      query: ({ rfpId, vendorIds }) => ({
        url: `/rfp/${rfpId}/send-to-vendors`,
        method: "POST",
        body: { vendorIds },
      }),
    }),
    getProposalsByRfp: builder.query({
      query: (rfpId) => `/proposals/by-rfp/${rfpId}`,
      providesTags: (result, error, rfpId) => [
        { type: "Proposal", id: `RFP-${rfpId}` },
      ],
    }),
    pollEmails: builder.mutation({
      query: () => ({
        url: "/proposals/poll-emails",
        method: "POST",
      }),
      invalidatesTags: ["Proposal"],
    }),

    getComparison: builder.query({
      query: (rfpId) => `/comparison/${rfpId}`,
      providesTags: (result, error, rfpId) => [
        { type: "Comparison", id: rfpId },
      ],
      keepUnusedDataFor: 0
    }),

    getRfpHistory: builder.query({
      query: () => `/rfp`,
      providesTags: () => [{ type: "Rfp" }],
    }),
    invalidatesTags: ["Comparison"],
  }),
});

export const {
  useCreateRfpFromTextMutation,
  useGetRfpByIdQuery,
  useGetRfpsQuery,
  useGetVendorsQuery,
  useCreateVendorMutation,
  useSendRfpToVendorsMutation,
  useGetProposalsByRfpQuery,
  usePollEmailsMutation,
  useGetComparisonQuery,
  useGetRfpHistoryQuery,
} = apiSlice;
