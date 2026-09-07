"use client";
import { useEffect } from "react";

export default function ReferralCapture(){
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const affiliate=params.get("ref");
    const invite=params.get("invite");
    if(affiliate) fetch(`/api/track?action=referral&code=${encodeURIComponent(affiliate)}&path=${encodeURIComponent(window.location.pathname)}&source=affiliate_link`,{credentials:"include"}).catch(()=>{});
    if(invite) fetch(`/api/track?action=user_invite&code=${encodeURIComponent(invite)}`,{credentials:"include"}).catch(()=>{});
  },[]);
  return null;
}
