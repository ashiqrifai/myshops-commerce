import { baseApi } from "./baseApi";
import type { AssignKioskPagePayload, CreateKioskProfilePayload, KioskProfileListResponse, KioskProfileResponse, UpdateKioskProfilePayload } from "@/types/kiosk";

export const kioskProfilesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKioskProfiles: builder.query<KioskProfileListResponse, {search?:string;isActive?:boolean}|void>({ query:(params)=>({url:"/admin/kiosk/profiles",params:params||undefined}) }),
    getKioskProfileById: builder.query<KioskProfileResponse,string>({ query:(id)=>({url:`/admin/kiosk/profiles/${id}`}) }),
    createKioskProfile: builder.mutation<KioskProfileResponse,CreateKioskProfilePayload>({ query:(body)=>({url:"/admin/kiosk/profiles",method:"POST",body}) }),
    updateKioskProfile: builder.mutation<KioskProfileResponse,{id:string;body:UpdateKioskProfilePayload}>({ query:({id,body})=>({url:`/admin/kiosk/profiles/${id}`,method:"PUT",body}) }),
    assignKioskProfilePage: builder.mutation<KioskProfileResponse,{id:string;body:AssignKioskPagePayload}>({ query:({id,body})=>({url:`/admin/kiosk/profiles/${id}/page`,method:"PUT",body}) }),
  }),
  overrideExisting:false,
});

export const { useGetKioskProfilesQuery, useGetKioskProfileByIdQuery, useCreateKioskProfileMutation, useUpdateKioskProfileMutation, useAssignKioskProfilePageMutation } = kioskProfilesApi;
