"use client";

import dynamic from "next/dynamic";
import {
  ChevronDown,
  Mail,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { FormEvent, ReactNode, useState } from "react";

const ContactMap = dynamic(() => import("./ContactMap"), {
  ssr: false,
  loading: () => <div className="h-[320px] w-full animate-pulse rounded-xl bg-[#eef0f2] sm:h-[380px] lg:h-[430px]" />,
});

const locations = [
  { id: "dubai-outlet-mall", name: "Dubai Outlet Mall , UAE", address: "Route 66 - Madinat Hind 1 - Dubai Outlet Mall - Dubai", phone: "8008989", email: "Support@MyShops.ae", latitude: 25.0736, longitude: 55.4006 },
  { id: "wafi-mall", name: "MY SHOPS Wafi Mall", address: "Inside Wafi Mall, Al Garhoud - Dubai", phone: "8008989", email: "Support@MyShops.ae", latitude: 25.2281, longitude: 55.3189 },
  { id: "deira-city-centre", name: "MyShops City Center Deira", address: "8th St - Port Saeed - Deira - Dubai", phone: "8008989", email: "Support@MyShops.ae", latitude: 25.2512, longitude: 55.3337 },
  { id: "souq-al-jami", name: "MY SHOPS Souq Al Jami", address: "Sheikh Zayed Grand Mosque Rd - Al Khaleej Al Arabi St - Abu Dhabi", phone: "8008989", email: "Support@MyShops.ae", latitude: 24.4128, longitude: 54.4747 },
];

function SeoBlock({ title, children }: { title: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <h2 className="text-[25px] font-bold leading-tight text-[#292929] sm:text-[28px]">{title}</h2>
      <div className={["relative mt-6 overflow-hidden text-[15px] leading-7 text-[#7b7b7b] sm:text-[16px]", expanded ? "" : "max-h-[76px]"].join(" ")}>
        {children}
        {!expanded ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" /> : null}
      </div>
      <button type="button" onClick={() => setExpanded(v => !v)} className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#f3f3f3] px-4 py-2.5 text-sm font-medium text-[#333] hover:bg-[#e9e9e9]">
        {expanded ? "Read Less" : "Read More"} <ChevronDown size={16} className={expanded ? "rotate-180" : ""} />
      </button>
    </div>
  );
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    setIsSubmitting(false);
    setSubmitted(true);
    event.currentTarget.reset();
  };

  return (
    <main className="bg-[#f5f5f5] pb-10">
      <div className="mx-auto w-full max-w-[1920px] px-3 py-4 sm:px-4 lg:px-5">
        <section className="overflow-hidden rounded-xl bg-white">
          <ContactMap locations={locations} />
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {locations.map(location => (
            <article key={location.id} className="min-h-[178px] rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-[19px] font-bold leading-6 text-[#2c2c2c]">{location.name}</h2>
              <p className="mt-3 text-[15px] leading-6 text-[#858585]">{location.address}</p>
              <div className="mt-3 space-y-1 text-[15px] text-[#333]">
                <p><span className="font-semibold">Phone: </span><a href={`tel:${location.phone}`} className="italic text-[#1687ff] hover:underline">{location.phone}</a></p>
                <p><span className="font-semibold">Email: </span><a href={`mailto:${location.email}`} className="italic text-[#1687ff] hover:underline">{location.email}</a></p>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_450px]">
          <div className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-[25px] font-bold text-[#2c2c2c]">Get in Touch</h2>
            {submitted ? <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Thank you. Your message has been received.</div> : null}
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input required name="firstName" placeholder="First name" className="h-11 rounded-md border border-[#dedede] px-4 text-sm outline-none focus:border-[#2daebe]" />
                <input required name="lastName" placeholder="Last name" className="h-11 rounded-md border border-[#dedede] px-4 text-sm outline-none focus:border-[#2daebe]" />
              </div>
              <input required type="email" name="email" placeholder="Email" className="mt-4 h-11 w-full rounded-md border border-[#dedede] px-4 text-sm outline-none focus:border-[#2daebe]" />
              <textarea required name="message" placeholder="Your Message" rows={8} className="mt-4 w-full resize-y rounded-md border border-[#dedede] p-4 text-sm outline-none focus:border-[#2daebe]" />
              <button disabled={isSubmitting} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#2daebe] px-5 text-sm font-semibold text-white hover:bg-[#2598a6] disabled:opacity-60">
                <Send size={15} /> {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          <aside className="self-start rounded-xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-[20px] font-bold text-[#2c2c2c]">Need a Help?</h2>
            <div className="mt-6 space-y-4">
              <a href="tel:8008989" className="flex items-center gap-3 text-[16px] font-medium"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2468e9] text-white"><Phone size={18}/></span>8008989</a>
            </div>
            <h3 className="mt-8 text-[19px] font-bold">Subscribe us</h3>
            <div className="mt-4 flex gap-3">
  <a
    href="#"
    aria-label="Facebook"
    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#365899] text-[18px] font-bold text-white"
  >
    f
  </a>


</div>
          </aside>
        </section>

        <section className="mt-5 space-y-7 rounded-xl bg-white p-5 shadow-sm sm:p-6">
          <SeoBlock title="Superior online shopping in the UAE">
            <p>As the leading destination for online shopping in the UAE, MyShops has everything you need under one roof. Whether you’re shopping for the latest electronic products , we have Thousands of products in the MyShops store. As a customer-centric online store, we make it easier to buy online with flexible payment plans that help you save, along with regular sales across our extensive product range, gift cards, wishlists , and so much more.</p>
            <p className="mt-5">At My Shops , we work hard to deliver the very best experience for our customers. We deliver to Dubai, Abu Dhabi and all other cities in the UAE. As a superstore with multiple departments and exceptional customer service, we offer so much more than your everyday online shopping experience.</p>
          </SeoBlock>
          <SeoBlock title="Shop the best products & brands at My Shops">
            <p>You’ll find a massive variety of products from top brands at My Shops UAE. Our electronics department has the latest mobile phones, along with tablets, mobile accessories, laptops, wearable technology such as smartwatches and other wearable devices, headphones (in-ear, wireless and noise-cancelling), audiovisual gear, a selection of cameras, televisions, video game consoles such as PC and Xbox controllers, and video games. We have products from Samsung, Xiaomi, Sony, HP, Dell, Huawei, Lenovo, Apple, and many other leading tech brands.</p>
          </SeoBlock>
        </section>
      </div>
    </main>
  );
}
