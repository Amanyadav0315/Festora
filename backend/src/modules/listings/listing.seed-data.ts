import type { CategorySlug, ListingType } from "@festora/types";

interface SeedVendor {
  name: string;
  phone: string;
  email: string;
  storeName: string;
  categories: CategorySlug[];
  city: string;
  listings: {
    categorySlug: CategorySlug;
    subcategorySlug?: string;
    type: ListingType;
    title: string;
    description: string;
    price: number;
    priceUnit?: string;
  }[];
}

const PLACEHOLDER_IMAGE = "/placeholder-listing.svg";

export const SEED_VENDORS: SeedVendor[] = [
  {
    name: "Rajesh Sharma",
    phone: "9810000001",
    email: "sharma.tents@festora.demo",
    storeName: "Sharma Tent House",
    categories: ["tent-house-mandap"],
    city: "Jaipur",
    listings: [
      {
        categorySlug: "tent-house-mandap",
        subcategorySlug: "tents",
        type: "rental",
        title: "Royal Wedding Mandap with Pillars",
        description: "Traditional decorated mandap setup with carved pillars, ideal for wedding ceremonies.",
        price: 25000,
        priceUnit: "per event",
      },
      {
        categorySlug: "tent-house-mandap",
        subcategorySlug: "chairs",
        type: "rental",
        title: "Napoleon Chairs (Set of 100)",
        description: "Gold Napoleon chairs with cushioned seats, delivery and setup included.",
        price: 8000,
        priceUnit: "per 100 chairs",
      },
    ],
  },
  {
    name: "DJ Karan",
    phone: "9810000002",
    email: "djkaran@festora.demo",
    storeName: "Karan Beats & Sound",
    categories: ["dj-sound"],
    city: "Mumbai",
    listings: [
      {
        categorySlug: "dj-sound",
        type: "service",
        title: "Wedding DJ with LED Dance Floor",
        description: "Full DJ setup with LED dance floor, moving head lights, and sound system for up to 500 guests.",
        price: 35000,
        priceUnit: "per event",
      },
    ],
  },
  {
    name: "Priya Studios",
    phone: "9810000003",
    email: "priya.studios@festora.demo",
    storeName: "Priya Photography Studio",
    categories: ["photography-videography"],
    city: "Delhi",
    listings: [
      {
        categorySlug: "photography-videography",
        subcategorySlug: "studios",
        type: "service",
        title: "Candid Wedding Photography Package",
        description: "Full day candid photography and cinematic videography with drone coverage.",
        price: 45000,
        priceUnit: "per day",
      },
    ],
  },
  {
    name: "Grand Palace Banquets",
    phone: "9810000004",
    email: "grandpalace@festora.demo",
    storeName: "Grand Palace Banquet Hall",
    categories: ["banquet-halls"],
    city: "Lucknow",
    listings: [
      {
        categorySlug: "banquet-halls",
        type: "venue",
        title: "AC Banquet Hall — 500 Guest Capacity",
        description: "Spacious air-conditioned banquet hall with in-house catering option and parking for 100 cars.",
        price: 120000,
        priceUnit: "per day",
      },
    ],
  },
  {
    name: "Annapurna Caterers",
    phone: "9810000005",
    email: "annapurna@festora.demo",
    storeName: "Annapurna Caterers",
    categories: ["catering"],
    city: "Pune",
    listings: [
      {
        categorySlug: "catering",
        subcategorySlug: "catering-services",
        type: "service",
        title: "North Indian Wedding Buffet (Veg)",
        description: "Multi-cuisine vegetarian buffet with live counters, serving staff included.",
        price: 650,
        priceUnit: "per plate",
      },
      {
        categorySlug: "catering",
        subcategorySlug: "fancy-food-displays",
        type: "rental",
        title: "Chocolate Fountain Live Counter",
        description: "3-tier chocolate fountain with assorted dippers, attendant included.",
        price: 6000,
        priceUnit: "per event",
      },
    ],
  },
  {
    name: "Green Valley Resorts",
    phone: "9810000006",
    email: "greenvalley@festora.demo",
    storeName: "Green Valley Farmhouse",
    categories: ["resorts-farmhouses"],
    city: "Lonavala",
    listings: [
      {
        categorySlug: "resorts-farmhouses",
        type: "venue",
        title: "Private Farmhouse with Pool — Full Day",
        description: "5-acre farmhouse with swimming pool, lawn, and rooms for 20 guests. Great for destination events.",
        price: 55000,
        priceUnit: "per day",
      },
    ],
  },
];

export { PLACEHOLDER_IMAGE };
