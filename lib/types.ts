export interface Photo {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  size?: string;
  imageWidth?: number;
  imageHeight?: number;
  thumbnailUrl?: string;
}

export const TRIP_CONFIG = {
  title: "OUR TRIP MEMORIES",
  subtitle: "Every journey. Every laugh. Every unforgettable moment.",
  location: "Configure me in lib/types.ts",
  description:
    "A living collection of the photos we took along the way — browse, relive, and keep the ones you love.",
  year: new Date().getFullYear(),
};
