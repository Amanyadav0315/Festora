import type { CategorySlug } from "@festora/types";

interface SeedSubcategory {
  name: string;
  slug: string;
  categorySlug: CategorySlug;
  icon: string;
  featured?: boolean;
}

// featured: true => shown in the homepage quick-access icon row
export const SEED_SUBCATEGORIES: SeedSubcategory[] = [
  // Homepage icon row
  { name: "Tents", slug: "tents", categorySlug: "tent-house-mandap", icon: "⛺", featured: true },
  { name: "Curtains & Drapes", slug: "curtains-drapes", categorySlug: "tent-house-mandap", icon: "🪟", featured: true },
  { name: "Chairs & Tables", slug: "chairs", categorySlug: "tent-house-mandap", icon: "🪑", featured: true },
  { name: "Utensils", slug: "tables", categorySlug: "tent-house-mandap", icon: "🍽️", featured: true },
  { name: "Catering Services", slug: "catering-services", categorySlug: "catering", icon: "🍛", featured: true },
  { name: "Photo/Video Studios", slug: "studios", categorySlug: "photography-videography", icon: "🎬", featured: true },
  { name: "Flowers & Decor", slug: "flowers-decor", categorySlug: "tent-house-mandap", icon: "💐", featured: true },
  { name: "Power & Utilities", slug: "power-utilities", categorySlug: "tent-house-mandap", icon: "🔌", featured: true },

  // Power & Utilities
  { name: "Climate Control Equipment", slug: "climate-control-equipment", categorySlug: "tent-house-mandap", icon: "❄️" },
  { name: "Sanitation & Restrooms", slug: "sanitation-restrooms", categorySlug: "tent-house-mandap", icon: "🚻" },

  // Structural & Rigging
  { name: "Crowd Control Barriers", slug: "crowd-control-barriers", categorySlug: "tent-house-mandap", icon: "🚧" },
  { name: "Iron Pole and Structure", slug: "scaffolding-temp-structures", categorySlug: "tent-house-mandap", icon: "🪜" },

  // Entertainment & Kids Zone
  { name: "Inflatables & Play Zones", slug: "inflatables-play-zones", categorySlug: "tent-house-mandap", icon: "🏰" },
  { name: "Games", slug: "arcade-virtual-games", categorySlug: "tent-house-mandap", icon: "🕹️" },

  // Special Effects (SFX)
  { name: "Atmospheric Effects", slug: "atmospheric-effects", categorySlug: "tent-house-mandap", icon: "🌫️" },

  // Craft & Artist Supplies
  { name: "Rangoli & Mandap Art", slug: "rangoli-mandap-art", categorySlug: "tent-house-mandap", icon: "🎨" },
  { name: "Live Screens and Paintings", slug: "canvas-live-painting", categorySlug: "tent-house-mandap", icon: "🖼️" },

  // Gifting & Invites
  { name: "Bulk Gifting Boxes", slug: "bulk-gifting-boxes", categorySlug: "tent-house-mandap", icon: "🎁" },

  // Hospitality & Bar Setup
  { name: "Bar Accessories", slug: "bar-accessories", categorySlug: "catering", icon: "🍹" },
  { name: "Fancy Food Displays", slug: "fancy-food-displays", categorySlug: "catering", icon: "🍰" },
  { name: "Event Uniforms", slug: "event-uniforms", categorySlug: "tent-house-mandap", icon: "🥻" },

  // Logistics & Transport
  { name: "Fibre Items", slug: "fabricated-event-vehicles", categorySlug: "tent-house-mandap", icon: "🐎" },

  // Prints & Signage
  { name: "Sign Boards", slug: "event-flex-signage-boards", categorySlug: "tent-house-mandap", icon: "🪧" },
  { name: "Wristbands & Entry Tokens", slug: "wristbands-entry-tokens", categorySlug: "tent-house-mandap", icon: "🎟️" },

  // Maintenance & Housekeeping
  { name: "Cleaning Tools", slug: "post-event-cleanup-tools", categorySlug: "tent-house-mandap", icon: "🧹" },
  { name: "Safety & First Aid", slug: "safety-first-aid", categorySlug: "tent-house-mandap", icon: "⛑️" },
];
